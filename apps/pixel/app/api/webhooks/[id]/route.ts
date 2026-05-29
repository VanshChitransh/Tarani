import { NextResponse } from "next/server";
import { removeWebhook } from "@tarani/monitor-store";
import { ensureDb } from "../../../../src/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  ensureDb();
  const { id } = await params;
  removeWebhook(id);
  return NextResponse.json({ ok: true, data: { removed: id } });
}
