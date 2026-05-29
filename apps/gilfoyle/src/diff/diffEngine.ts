import type {
  CompatibilityDiff,
  CompatibilityDiffKind,
  CompatibilityStatus,
  VenueCompatibilityResult,
} from "@tarani/shared";

const STATUS_RANK: Record<CompatibilityStatus, number> = {
  supported: 3,
  partial: 2,
  conditional: 1,
  unknown: 0,
  blocked: -1,
};

function deriveKind(from: CompatibilityStatus, to: CompatibilityStatus): CompatibilityDiffKind {
  const delta = STATUS_RANK[to] - STATUS_RANK[from];
  if (delta > 0) return "improved";
  if (delta < 0) return "degraded";
  return "changed";
}

export function diffCompatibility(
  baseline: VenueCompatibilityResult[],
  current: VenueCompatibilityResult[],
): CompatibilityDiff[] {
  const diffs: CompatibilityDiff[] = [];
  const now = new Date().toISOString();

  const baselineMap = new Map(baseline.map((r) => [r.venue, r.status]));
  const currentMap = new Map(current.map((r) => [r.venue, r.status]));

  for (const [venue, currentStatus] of currentMap) {
    const baselineStatus = baselineMap.get(venue);
    if (baselineStatus === undefined || baselineStatus === currentStatus) continue;
    diffs.push({
      venue,
      kind: deriveKind(baselineStatus, currentStatus),
      from: baselineStatus,
      to: currentStatus,
      detectedAt: now,
    });
  }

  for (const [venue, baselineStatus] of baselineMap) {
    if (!currentMap.has(venue)) {
      diffs.push({
        venue,
        kind: "changed",
        from: baselineStatus,
        to: baselineStatus,
        detectedAt: now,
      });
    }
  }

  return diffs;
}
