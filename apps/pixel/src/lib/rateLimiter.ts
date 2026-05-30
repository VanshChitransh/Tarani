import { checkRateLimit as storeCheckRateLimit } from "@tarani/monitor-store";
import { ensureDb } from "./db";

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  await ensureDb();
  return storeCheckRateLimit(key, maxRequests, windowMs);
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
