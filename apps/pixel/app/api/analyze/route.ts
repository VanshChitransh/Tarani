import { NextResponse } from "next/server";
import {
  analyzeRequestSchema,
  analyzeResponseSchema,
  type AnalyzeResponse,
  type ApiError,
  type ApiErrorCode,
} from "@tarani/shared";
import {
  HeliusClient,
  HeliusClientError,
  parseMintProfile,
  runCompatibilityEngine,
  scoreRisk,
  generateRecommendations,
  buildPrelaunchProfile,
} from "@tarani/gilfoyle";
import { checkRateLimit, getClientIp } from "../../../src/lib/rateLimiter";
import { findMintFixtureByAddress } from "@tarani/test-fixtures";

const MAX_BODY_BYTES = 10_240;

const ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UPSTREAM_TIMEOUT: 503,
  UPSTREAM_ERROR: 502,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

function errorResponse(error: ApiError) {
  const body: AnalyzeResponse = { ok: false, error };
  return NextResponse.json(body, { status: ERROR_HTTP_STATUS[error.code] });
}

export async function POST(req: Request) {
  const cl = req.headers.get("content-length");
  if (cl && parseInt(cl, 10) > MAX_BODY_BYTES) {
    return errorResponse({ code: "BAD_REQUEST", message: "Request body too large" });
  }

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`analyze:${ip}`, 10, 60_000))) {
    return errorResponse({ code: "RATE_LIMITED", message: "Too many requests" });
  }

  const raw = await req.json().catch(() => null);
  const parsed = analyzeRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      details: { issues: parsed.error.issues },
    });
  }

  const { mint, mode, config } = parsed.data;

  if (mode === "prelaunch") {
    if (!config) {
      return errorResponse({
        code: "BAD_REQUEST",
        message: "config is required for prelaunch mode",
      });
    }
    const profile = buildPrelaunchProfile(config);
    const compatibility = await runCompatibilityEngine(profile);
    const risks = scoreRisk(profile, compatibility);
    const recommendations = generateRecommendations(risks, compatibility);
    return NextResponse.json({
      ok: true,
      data: {
        profile,
        compatibility,
        risks,
        recommendations,
        generatedAt: new Date().toISOString(),
      },
    });
  }

  if (!mint) {
    return errorResponse({ code: "BAD_REQUEST", message: "mint is required" });
  }

  const client = new HeliusClient();

  // Fetch live mint data. When DEMO_MODE is on and the live RPC is unavailable,
  // fall back to a bundled fixture for the same address so a demo never dies on
  // a flaky network. DEMO_MODE is off by default, so production never silently
  // serves stand-in data.
  let asset: Awaited<ReturnType<HeliusClient["fetchMintAsset"]>>;
  try {
    asset = await client.fetchMintAsset(mint);
  } catch (err) {
    const fixture = process.env.DEMO_MODE === "true" ? findMintFixtureByAddress(mint) : null;
    if (!fixture) {
      if (err instanceof HeliusClientError) {
        return errorResponse({ code: err.code, message: err.message, details: err.details });
      }
      return errorResponse({
        code: "INTERNAL",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
    console.warn(
      `[analyze] DEMO_MODE fallback: live fetch failed for ${mint}, serving bundled fixture`,
    );
    asset = fixture as Awaited<ReturnType<HeliusClient["fetchMintAsset"]>>;
  }

  try {
    const profile = parseMintProfile(asset);
    const compatibility = await runCompatibilityEngine(profile);
    const risks = scoreRisk(profile, compatibility);
    const recommendations = generateRecommendations(risks, compatibility);
    const body: AnalyzeResponse = {
      ok: true,
      data: {
        profile,
        compatibility,
        risks,
        recommendations,
        generatedAt: new Date().toISOString(),
      },
    };

    if (process.env.NODE_ENV !== "production") {
      const check = analyzeResponseSchema.safeParse(body);
      if (!check.success) {
        console.error("[analyze] Response shape drift detected", check.error.issues);
      }
    }

    return NextResponse.json(body);
  } catch (err) {
    return errorResponse({
      code: "INTERNAL",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
