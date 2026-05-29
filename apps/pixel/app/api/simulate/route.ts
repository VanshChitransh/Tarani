import { NextResponse } from "next/server";
import {
  simulationRequestSchema,
  simulationResponseSchema,
  type SimulationResponse,
  type ApiError,
  type ApiErrorCode,
} from "@tarani/shared";
import { checkRateLimit, getClientIp } from "../../../src/lib/rateLimiter";

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
  const body: SimulationResponse = { ok: false, error };
  return NextResponse.json(body, { status: ERROR_HTTP_STATUS[error.code] });
}

export async function POST(req: Request) {
  const cl = req.headers.get("content-length");
  if (cl && parseInt(cl, 10) > MAX_BODY_BYTES) {
    return errorResponse({ code: "BAD_REQUEST", message: "Request body too large" });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(`simulate:${ip}`, 5, 60_000)) {
    return errorResponse({ code: "RATE_LIMITED", message: "Too many requests" });
  }

  const raw = await req.json().catch(() => null);
  const parsed = simulationRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      details: { issues: parsed.error.issues },
    });
  }

  const kotlerUrl = process.env.KOTLER_URL ?? "http://localhost:3001";

  let kotlerRes: Response;
  try {
    kotlerRes = await fetch(`${kotlerUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return errorResponse({
      code: isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR",
      message: isTimeout
        ? "Simulation timed out after 60 seconds"
        : "Could not reach simulation worker",
    });
  }

  if (!kotlerRes.ok) {
    return errorResponse({
      code: "UPSTREAM_ERROR",
      message: `Simulation worker returned HTTP ${kotlerRes.status}`,
    });
  }

  const body = (await kotlerRes.json()) as SimulationResponse;

  if (process.env.NODE_ENV !== "production") {
    const check = simulationResponseSchema.safeParse(body);
    if (!check.success) {
      console.error("[simulate] Response shape drift detected", check.error.issues);
    }
  }

  return NextResponse.json(body);
}
