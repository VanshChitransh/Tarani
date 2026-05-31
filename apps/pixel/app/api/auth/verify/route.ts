import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeNonce } from "@tarani/monitor-store";
import {
  buildSignInMessage,
  verifyWalletSignature,
  signSession,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  NONCE_TTL_MS,
} from "../../../../src/lib/auth";
import { ensureDb } from "../../../../src/lib/db";
import { checkRateLimit, getClientIp } from "../../../../src/lib/rateLimiter";

const bodySchema = z.object({
  address: z.string().min(32).max(44),
  nonce: z.string().min(1),
  signature: z.string().min(1),
});

function unauthorized(message: string) {
  return NextResponse.json({ ok: false, error: { message } }, { status: 401 });
}

export async function POST(req: Request) {
  await ensureDb();

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`auth-verify:${ip}`, 30, 60_000))) {
    return NextResponse.json(
      { ok: false, error: { message: "Too many requests" } },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { message: "Invalid request body" } },
      { status: 400 },
    );
  }
  const { address, nonce, signature } = parsed.data;

  // Consume the nonce first so a failed verify can't be retried against it.
  if (!(await consumeNonce(nonce, NONCE_TTL_MS))) {
    return unauthorized("Invalid or expired sign-in request. Please try again.");
  }

  const domain = new URL(req.url).host;
  const message = buildSignInMessage({ domain, address, nonce });
  if (!verifyWalletSignature(address, message, signature)) {
    return unauthorized("Signature verification failed.");
  }

  const res = NextResponse.json({ ok: true, data: { address } });
  res.cookies.set(SESSION_COOKIE, signSession(address), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
