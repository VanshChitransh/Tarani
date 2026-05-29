import { NextResponse } from "next/server";
import {
  monitorRequestSchema,
  monitorResponseSchema,
  monitorListResponseSchema,
  type ApiError,
  type ApiErrorCode,
} from "@tarani/shared";
import { addMint, listMints } from "@tarani/monitor-store";
import { ensureDb } from "../../../src/lib/db";

const ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UPSTREAM_TIMEOUT: 503,
  UPSTREAM_ERROR: 502,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

function errorResponse(error: ApiError) {
  return NextResponse.json({ ok: false, error }, { status: ERROR_HTTP_STATUS[error.code] });
}

export async function POST(req: Request) {
  ensureDb();

  const raw = await req.json().catch(() => null);
  const parsed = monitorRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse({ code: "BAD_REQUEST", message: "Invalid request body" });
  }

  try {
    const record = addMint(parsed.data.mint, parsed.data.subscriberId);
    const body = monitorResponseSchema.parse({
      ok: true,
      data: { subscriptionId: record.subscriptionId, mint: record.mint },
    });
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof Error && err.message === "MAX_MONITORED_MINTS_EXCEEDED") {
      return errorResponse({
        code: "RATE_LIMITED",
        message: "Maximum monitored mints limit reached",
      });
    }
    return errorResponse({ code: "INTERNAL", message: "Failed to add mint" });
  }
}

export async function GET() {
  ensureDb();
  const mints = listMints();
  const body = monitorListResponseSchema.parse({ ok: true, data: mints });
  return NextResponse.json(body);
}
