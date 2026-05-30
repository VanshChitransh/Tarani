import { NextResponse } from "next/server";
import {
  HeliusClient,
  parseMintProfile,
  runCompatibilityEngine,
  diffCompatibility,
} from "@tarani/gilfoyle";
import {
  listMints,
  listWebhooks,
  getLatestSnapshot,
  saveSnapshot,
  saveDiff,
  updateLastChecked,
} from "@tarani/monitor-store";
import { ensureDb } from "../../../../src/lib/db";

async function dispatchAlerts(
  mint: string,
  diffs: Awaited<ReturnType<typeof diffCompatibility>>,
): Promise<void> {
  const webhooks = await listWebhooks();
  if (webhooks.length === 0) return;
  const body = JSON.stringify({ mint, diffs, detectedAt: new Date().toISOString() });
  await Promise.allSettled(
    webhooks.map((wh) =>
      fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(5_000),
      }).catch(() => {}),
    ),
  );
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

export async function GET() {
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
