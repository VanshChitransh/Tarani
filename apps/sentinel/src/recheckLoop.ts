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
} from "@tarani/monitor-store";

const MAX_CONSECUTIVE_FAILURES = 3;
const failureCounts = new Map<string, number>();

async function recheckMint(mint: string): Promise<void> {
  const failures = failureCounts.get(mint) ?? 0;
  if (failures >= MAX_CONSECUTIVE_FAILURES) {
    console.warn(`[sentinel] Skipping ${mint}: ${failures} consecutive failures, backing off`);
    return;
  }

  try {
    const client = new HeliusClient();
    const asset = await client.fetchMintAsset(mint);
    const profile = parseMintProfile(asset);
    const results = await runCompatibilityEngine(profile);

    const now = new Date().toISOString();
    const current = { mint, capturedAt: now, results };

    const baseline = getLatestSnapshot(mint);
    if (baseline) {
      const diffs = diffCompatibility(baseline, current);
      if (diffs.length > 0) {
        saveDiff(mint, diffs);
        console.log(`[sentinel] ${mint}: ${diffs.length} diff(s) detected`);
      }
    }

    saveSnapshot(mint, current);
    updateLastChecked(mint, now);
    failureCounts.set(mint, 0);
  } catch (err) {
    failureCounts.set(mint, (failureCounts.get(mint) ?? 0) + 1);
    console.error(`[sentinel] Error rechecking ${mint}:`, err);
  }
}

async function tick(): Promise<void> {
  const mints = listMints();
  if (mints.length === 0) {
    console.log("[sentinel] No mints to recheck");
    return;
  }
  console.log(`[sentinel] Rechecking ${mints.length} mint(s)...`);
  await Promise.allSettled(mints.map((r) => recheckMint(r.mint)));
}

export async function runRecheckLoop(intervalMs: number): Promise<void> {
  console.log(`[sentinel] Recheck loop started (interval: ${intervalMs}ms)`);
  await tick();
  setInterval(tick, intervalMs);
}
