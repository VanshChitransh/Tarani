import { NextResponse } from "next/server";
import { z } from "zod";
import { saveNonce } from "@tarani/monitor-store";
import { buildSignInMessage, createNonce } from "../../../../src/lib/auth";
import { ensureDb } from "../../../../src/lib/db";
import { checkRateLimit, getClientIp } from "../../../../src/lib/rateLimiter";

const bodySchema = z.object({ address: z.string().min(32).max(44) });

export async function POST(req: Request) {
  await ensureDb();

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`auth-nonce:${ip}`, 30, 60_000))) {
    return NextResponse.json(
      { ok: false, error: { message: "Too many requests" } },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { message: "address is required" } },
      { status: 400 },
    );
  }

  const nonce = createNonce();
  await saveNonce(nonce, Date.now());

  const domain = new URL(req.url).host;
  const message = buildSignInMessage({ domain, address: parsed.data.address, nonce });

  return NextResponse.json({ ok: true, data: { nonce, message } });
}
