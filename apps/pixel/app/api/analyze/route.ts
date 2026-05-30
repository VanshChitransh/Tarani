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
import { ensureDb } from "../../../src/lib/db";
import { getLatestReport, saveReport } from "@tarani/monitor-store";
import type { AnalyzeReport } from "@tarani/shared";

const MAX_BODY_BYTES = 10_240;

/**
 * Stable signature of the parts of a report we treat as "meaningful change":
 * per-venue verdicts and the set of risk findings. Profile churn (e.g. supply
 * changing) does not trigger a new history row.
 */
function reportSignature(report: AnalyzeReport): string {
  const venues = [...report.compatibility].map((c) => `${c.venue}:${c.status}`).sort();
  const risks = [...report.risks].map((r) => r.id).sort();
  return JSON.stringify({ venues, risks });
}

/**
 * Persist an ad-hoc report into history, but only if its verdict differs from
 * the most recent stored snapshot. Fully isolated: any failure (no DB
 * configured, write error) is swallowed so analysis always succeeds.
 */
async function persistReportHistory(mint: string, report: AnalyzeReport): Promise<void> {
  try {
    await ensureDb();
    const latest = await getLatestReport(mint);
    if (latest && reportSignature(latest.report) === reportSignature(report)) {
      return;
    }
    await saveReport(mint, report, report.generatedAt);
  } catch (err) {
    console.error("[analyze] Failed to persist report history", err);
  }
}

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
  try {
    const asset = await client.fetchMintAsset(mint);
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

    // Persist into ad-hoc report history (write-if-changed). Awaited so the
    // write completes before the serverless function freezes on return, but
    // isolated so a DB failure never breaks the analysis response.
    await persistReportHistory(mint, body.data);

    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof HeliusClientError) {
      return errorResponse({ code: err.code, message: err.message, details: err.details });
    }
    return errorResponse({
      code: "INTERNAL",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
