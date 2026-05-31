import type { CompatibilityEvidence, VenueCompatibilityResult } from "@tarani/shared";

/**
 * Normalized outcome of a venue liquidity/route probe, independent of the
 * venue-specific API shape:
 *  - "exists":  a live on-chain pool or swap route was found for this mint.
 *  - "absent":  the venue API responded but reported no pool/route.
 *  - "unknown": the probe could not reach a conclusion (network/timeout/error).
 */
export type ProbePresence = "exists" | "absent" | "unknown";

/**
 * Reconcile a rule-derived (heuristic) verdict with a live probe result.
 *
 * This is the single source of truth for how every venue adapter folds a probe
 * into its verdict, so the behavior is identical across Jupiter, Raydium, and
 * Orca instead of each adapter inventing its own (inconsistent) logic.
 *
 * Principle: a live, on-chain market is ground truth. If the venue is actually
 * trading this mint right now, it is tradeable here — regardless of what the
 * static rule predicted. Venue rules describe *permissionless* support; they
 * cannot see permissioned/whitelisted pools (e.g. xStocks on Raydium, or an
 * Orca TokenBadge that has already been issued). So a confirmed pool/route
 * overrides any worse-than-supported verdict.
 *
 * Conversely, the absence of a market never fabricates support: it can only
 * soften an over-optimistic "supported" rule down to "partial" (the extensions
 * are individually fine, but nothing is trading here yet).
 */
export function reconcileProbe(
  base: VenueCompatibilityResult,
  presence: ProbePresence,
  probeEvidence: CompatibilityEvidence,
): VenueCompatibilityResult {
  if (presence === "unknown") {
    // Probe inconclusive — keep the heuristic verdict untouched (no evidence,
    // no source change), so a flaky network never degrades the report.
    return base;
  }

  const evidence = [...base.evidence, probeEvidence];

  if (presence === "exists") {
    // A live pool/route proves the mint is tradeable at this venue. Override any
    // blocked/conditional/partial/unknown verdict to supported.
    if (base.status !== "supported") {
      return {
        ...base,
        status: "supported",
        source: "probe",
        confidence: "high",
        evidence,
        notes: [
          ...base.notes,
          "Overridden to supported: a live on-chain pool/route was found for this mint, proving it " +
            "trades here despite the venue's rule-based restriction (e.g. a permissioned or whitelisted pool).",
        ],
      };
    }
    return { ...base, source: "probe", evidence };
  }

  // presence === "absent": no live market found. Do not fabricate support.
  if (base.status === "supported") {
    return {
      ...base,
      status: "partial",
      source: "probe",
      evidence,
      notes: [
        ...base.notes,
        "No live on-chain pool/route was found for this mint at this venue, so it is not currently " +
          "tradeable here even though its extensions are individually supported.",
      ],
    };
  }
  return { ...base, source: "probe", evidence };
}
