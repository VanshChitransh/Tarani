import { NextResponse } from "next/server";
import { monitorDetailResponseSchema, type ApiError, type ApiErrorCode } from "@tarani/shared";
import { getMint, removeMint, getLatestSnapshot, getLatestDiff } from "@tarani/monitor-store";
import { ensureDb } from "../../../../src/lib/db";

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

export async function GET(_req: Request, { params }: { params: Promise<{ mint: string }> }) {
  await ensureDb();
  const { mint } = await params;
  const record = await getMint(mint);
  if (!record) {
    return errorResponse({ code: "NOT_FOUND", message: "Mint not monitored" });
  }

  const latestSnapshot = await getLatestSnapshot(mint);
  const latestDiff = await getLatestDiff(mint);

  const body = monitorDetailResponseSchema.parse({
    ok: true,
    data: { ...record, latestSnapshot, latestDiff },
  });
  return NextResponse.json(body);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ mint: string }> }) {
  await ensureDb();
  const { mint } = await params;
  const record = await getMint(mint);
  if (!record) {
    return errorResponse({ code: "NOT_FOUND", message: "Mint not monitored" });
  }

  await removeMint(mint);
  return NextResponse.json({ ok: true, data: { removed: mint } });
}
