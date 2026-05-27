import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  return NextResponse.json({ ok: true, route: "badge", status: "stub", mint });
}
