import { NextResponse } from "next/server";
import {
  registerWebhookRequestSchema,
  registerWebhookResponseSchema,
  webhookListResponseSchema,
} from "@tarani/shared";
import { addWebhook, listWebhooks } from "@tarani/monitor-store";
import { ensureDb } from "../../../src/lib/db";
import { checkRateLimit, getClientIp } from "../../../src/lib/rateLimiter";

export async function POST(req: Request) {
  await ensureDb();

  const cl = req.headers.get("content-length");
  if (cl && parseInt(cl, 10) > 10_240) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Request body too large" } },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`webhooks:${ip}`, 10, 60_000))) {
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = registerWebhookRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid request body" } },
      { status: 400 },
    );
  }

  const record = await addWebhook(parsed.data.url);
  const body = registerWebhookResponseSchema.parse({ ok: true, data: record });
  return NextResponse.json(body);
}

export async function GET() {
  await ensureDb();
  const hooks = await listWebhooks();
  const body = webhookListResponseSchema.parse({ ok: true, data: hooks });
  return NextResponse.json(body);
}
