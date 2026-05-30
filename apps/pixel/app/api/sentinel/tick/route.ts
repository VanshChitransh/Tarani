import { NextResponse } from "next/server";
import {
  HeliusClient,
  parseMintProfile,
  runCompatibilityEngine,
  diffCompatibility,
} from "@tarani/gilfoyle";
import {
  listMints,
  getLatestSnapshot,
  saveSnapshot,
  saveDiff,
  updateLastChecked,
  dispatchToWebhooks,
} from "@tarani/monitor-store";
import { ensureDb } from "../../../../src/lib/db";

async function dispatchAlerts(
  mint: string,
  diffs: Awaited<ReturnType<typeof diffCompatibility>>,
): Promise<void> {
  await dispatchToWebhooks(JSON.stringify({ mint, diffs, detectedAt: new Date().toISOString() }));
}

async function recheckMint(mint: string): Promise<void> {
  const client = new HeliusClient();
  const asset = await client.fetchMintAsset(mint);
  const profile = parseMintProfile(asset);
  const results = await runCompatibilityEngine(profile);

  const now = new Date().toISOString();
  const current = { mint, capturedAt: now, results };

  const baseline = await getLatestSnapshot(mint);
  if (baseline) {
    const diffs = diffCompatibility(baseline.results, current.results);
    if (diffs.length > 0) {
      await saveDiff(mint, diffs);
      await dispatchAlerts(mint, diffs);
    }
  }

  await saveSnapshot(mint, current);
  await updateLastChecked(mint, now);
}

export async function GET(request: Request) {
  // Vercel attaches `Authorization: Bearer <CRON_SECRET>` to scheduled invocations
  // when CRON_SECRET is set. Reject anything else so this expensive endpoint
  // (Helius fetch + DB write per tracked mint) can't be triggered by the public.
  // When CRON_SECRET is unset (local/dev), the endpoint stays open for manual triggers.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    await ensureDb();

    const mints = await listMints();
    if (mints.length === 0) {
      return NextResponse.json({ ok: true, data: { rechecked: 0 } });
    }

    const results = await Promise.allSettled(mints.map((r) => recheckMint(r.mint)));

    const failed = results.filter((r) => r.status === "rejected").length;
    const rechecked = results.length - failed;

    return NextResponse.json({ ok: true, data: { rechecked, failed } });
  } catch (err) {
    return NextResponse.json({ ok: false, error: { message: String(err) } }, { status: 500 });
  }
}
