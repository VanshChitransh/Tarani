import { NextResponse } from "next/server";
import type { AnalyzeRequest } from "@tarani/shared";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<AnalyzeRequest>;
  return NextResponse.json({
    ok: true,
    route: "analyze",
    status: "stub",
    receivedMint: body.mint ?? null,
  });
}
