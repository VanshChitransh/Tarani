import { checkRateLimit as storeCheckRateLimit } from "@tarani/monitor-store";
import { ensureDb } from "./db";

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  // Fail open: if the limiter's backing store is unavailable (not configured,
  // outage), allow the request rather than 500 the entire API. Rate limiting is
  // a protection layer, not a correctness gate — losing it must not take the
  // service down.
  try {
    await ensureDb();
    return await storeCheckRateLimit(key, maxRequests, windowMs);
  } catch (err) {
    console.error("[rateLimiter] backing store unavailable, failing open", err);
    return true;
  }
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
