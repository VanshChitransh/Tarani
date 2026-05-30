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
import { dispatchAlerts } from "./alertDispatcher";

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

    const baseline = await getLatestSnapshot(mint);
    if (baseline) {
      const diffs = diffCompatibility(baseline.results, current.results);
      if (diffs.length > 0) {
        await saveDiff(mint, diffs);
        await dispatchAlerts(mint, diffs);
        console.log(`[sentinel] ${mint}: ${diffs.length} diff(s) detected`);
      }
    }

    await saveSnapshot(mint, current);
    await updateLastChecked(mint, now);
    failureCounts.set(mint, 0);
  } catch (err) {
    failureCounts.set(mint, (failureCounts.get(mint) ?? 0) + 1);
    console.error(`[sentinel] Error rechecking ${mint}:`, err);
  }
}

export async function tick(): Promise<void> {
  const mints = await listMints();

  // Evict failure counters for mints that are no longer tracked. Without this
  // the map grows without bound over the process lifetime as mints are added
  // and removed (the entry for a removed mint would otherwise live forever).
  const active = new Set(mints.map((r) => r.mint));
  for (const key of failureCounts.keys()) {
    if (!active.has(key)) failureCounts.delete(key);
  }

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

  // Guard against overlap: if a tick runs longer than the interval, skip the
  // next firing rather than letting ticks pile up and race (duplicate webhook
  // dispatches, contended DB writes). The try/catch also stops a rejected tick
  // from becoming an unhandled rejection that could crash the process.
  let running = false;
  setInterval(async () => {
    if (running) {
      console.warn("[sentinel] Previous recheck tick still running; skipping this interval");
      return;
    }
    running = true;
    try {
      await tick();
    } catch (err) {
      console.error("[sentinel] recheck tick error:", err);
    } finally {
      running = false;
    }
  }, intervalMs);
}
