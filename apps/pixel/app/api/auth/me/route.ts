import { NextResponse } from "next/server";
import { getAuthedAddress } from "../../../../src/lib/auth";

export async function GET(req: Request) {
  const address = getAuthedAddress(req);
  return NextResponse.json({ ok: true, data: { address } });
}
