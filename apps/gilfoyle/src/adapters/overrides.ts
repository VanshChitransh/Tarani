import type { MintProfile, VenueCompatibilityResult, VenueId } from "@tarani/shared";
import { VENUE_IDS, COMPATIBILITY_STATUS_VALUES } from "@tarani/shared";
import overridesFile from "../../rules/overrides.json";

type CompatibilityStatus = VenueCompatibilityResult["status"];

/**
 * A manual correction to a venue verdict. Applied after the adapter runs: when
 * `venue` matches (and `extension`, if given, is present on the mint), the
 * result's status is forced and its source becomes "override". This is the thin
 * manual layer the roadmap calls for — narrow, evidence-tagged, and off by
 * default (the file ships empty).
 */
export interface CompatibilityOverride {
  venue: VenueId;
  status: CompatibilityStatus;
  reason: string;
  /** Optional: only apply when the mint has this extension kind. */
  extension?: string;
}

export class OverrideValidationError extends Error {
  constructor(message: string) {
    super(`overrides.json is invalid: ${message}`);
    this.name = "OverrideValidationError";
  }
}

function loadOverrides(): CompatibilityOverride[] {
  const file = overridesFile as { overrides?: unknown };
  if (!file || !Array.isArray(file.overrides)) {
    throw new OverrideValidationError("expected a top-level `overrides` array");
  }
  const venues = new Set<string>(VENUE_IDS);
  const statuses = new Set<string>(COMPATIBILITY_STATUS_VALUES);

  return (file.overrides as CompatibilityOverride[]).map((o, i) => {
    if (!o || !venues.has(o.venue)) {
      throw new OverrideValidationError(`override[${i}] has an unknown venue "${o?.venue}"`);
    }
    if (!statuses.has(o.status)) {
      throw new OverrideValidationError(`override[${i}] has an invalid status "${o?.status}"`);
    }
    if (typeof o.reason !== "string" || o.reason.length === 0) {
      throw new OverrideValidationError(`override[${i}] needs a non-empty reason`);
    }
    return { venue: o.venue, status: o.status, reason: o.reason, extension: o.extension };
  });
}

export const OVERRIDES: CompatibilityOverride[] = loadOverrides();

/**
 * Apply the first matching manual override to a venue result, tagging the
 * verdict as override-sourced with an evidence note. Returns the result
 * unchanged when nothing matches (the common case — the file ships empty).
 */
export function applyOverride(
  result: VenueCompatibilityResult,
  profile: MintProfile,
  overrides: CompatibilityOverride[] = OVERRIDES,
): VenueCompatibilityResult {
  const match = overrides.find(
    (o) =>
      o.venue === result.venue &&
      (!o.extension || profile.extensions.some((e) => e.kind === o.extension)),
  );
  if (!match) return result;

  return {
    ...result,
    status: match.status,
    source: "override",
    notes: [...result.notes, match.reason],
    evidence: [
      ...result.evidence,
      {
        kind: "doc",
        reference: "Manual compatibility override",
        snippet: match.reason,
        observedAt: new Date().toISOString(),
      },
    ],
  };
}
