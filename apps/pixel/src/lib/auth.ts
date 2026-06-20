import nacl from "tweetnacl";
import bs58 from "bs58";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tarani_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * HMAC secret for session tokens. Must be set in production; a fixed dev value
 * is used otherwise so local development works without configuration.
 */
function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not set (set a strong random string in production)");
  }
  return "dev-insecure-auth-secret-change-me";
}

/** The exact message a wallet signs to authenticate. Rebuilt verbatim on verify. */
export function buildSignInMessage(params: {
  domain: string;
  address: string;
  nonce: string;
}): string {
  const { domain, address, nonce } = params;
  return [
    `${domain} wants you to sign in with your Solana account:`,
    address,
    "",
    "Sign in to Tarani to manage your tracked mints. This request will not trigger a transaction or cost any fees.",
    "",
    `Nonce: ${nonce}`,
  ].join("\n");
}

/** Verify an ed25519 wallet signature over `message` for base58 `address`. */
export function verifyWalletSignature(
  address: string,
  message: string,
  signatureBase58: string,
): boolean {
  try {
    const pub = bs58.decode(address);
    const sig = bs58.decode(signatureBase58);
    if (pub.length !== 32 || sig.length !== 64) return false;
    const msg = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msg, sig, pub);
  } catch {
    return false;
  }
}

export function createNonce(): string {
  return bs58.encode(randomBytes(24));
}

// Session token format: base64url(address).<expiryMs>.<hmac> — stateless and tamper-evident.
export function signSession(address: string, now: number = Date.now()): string {
  const exp = now + SESSION_TTL_MS;
  const payload = `${Buffer.from(address).toString("base64url")}.${exp}`;
  const sig = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  now: number = Date.now(),
): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encAddr, expStr, sig] = parts;
  const expected = createHmac("sha256", authSecret())
    .update(`${encAddr}.${expStr}`)
    .digest("base64url");
  const got = Buffer.from(sig);
  const want = Buffer.from(expected);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || now > exp) return null;
  try {
    return Buffer.from(encAddr, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/** Extract the authenticated wallet address from a request's session cookie, or null. */
export function getAuthedAddress(req: Request, now: number = Date.now()): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  const raw = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return verifySessionToken(raw ? decodeURIComponent(raw) : null, now);
}
