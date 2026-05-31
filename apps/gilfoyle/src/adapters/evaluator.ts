import type {
  CompatibilityEvidence,
  CompatibilityStatus,
  ConfidenceLevel,
  MintProfile,
  VenueCompatibilityResult,
  VenueFeatureStatus,
} from "@tarani/shared";
import { EXTENSION_KINDS } from "@tarani/shared";
import type { VenueRule, VenueRuleFeature } from "../rules";

interface FeatureVerdict {
  status: CompatibilityStatus;
  confidence: ConfidenceLevel;
  evidence: CompatibilityEvidence[];
  notes: string[];
}

const STATUS_RANK: Record<CompatibilityStatus, number> = {
  blocked: 5,
  conditional: 4,
  partial: 3,
  unknown: 2,
  supported: 1,
};

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const KNOWN_EXTENSION_KINDS = new Set<string>(EXTENSION_KINDS);

function evaluateFeature(profile: MintProfile, feature: VenueRuleFeature): FeatureVerdict | null {
  if (!KNOWN_EXTENSION_KINDS.has(feature.id)) {
    console.warn(
      `[evaluator] Feature id "${feature.id}" is not a known extension kind — possible typo in rule JSON`,
    );
  }

  const applies = profile.extensions.some((ext) => ext.kind === feature.id);
  if (!applies) return null;

  const observedAt = new Date().toISOString();
  const evidence: CompatibilityEvidence[] = (feature.evidence ?? []).map((ref) => ({
    kind: "doc",
    reference: ref,
    observedAt,
  }));

  return {
    status: feature.status,
    confidence: feature.confidence ?? "low",
    evidence,
    notes: feature.notes ?? [],
  };
}

export function pickOverallStatus(verdicts: FeatureVerdict[]): CompatibilityStatus {
  if (verdicts.length === 0) return "unknown";
  return verdicts.reduce<CompatibilityStatus>((worst, v) => {
    return STATUS_RANK[v.status] > STATUS_RANK[worst] ? v.status : worst;
  }, "supported");
}

export function aggregateConfidence(
  verdicts: FeatureVerdict[],
  overallStatus: CompatibilityStatus,
): ConfidenceLevel {
  if (verdicts.length === 0) return "low";
  const drivers = verdicts.filter((v) => v.status === overallStatus);
  return drivers.reduce<ConfidenceLevel>((lowest, v) => {
    return CONFIDENCE_RANK[v.confidence] < CONFIDENCE_RANK[lowest] ? v.confidence : lowest;
  }, "high");
}

// Multiple features in one venue rule often cite the same source URL or note, which
// would otherwise repeat 4-8x in a single venue result. Dedupe so each unique source
// (by kind + reference) and each unique note appears once.
function collectEvidence(verdicts: FeatureVerdict[]): CompatibilityEvidence[] {
  const seen = new Set<string>();
  const out: CompatibilityEvidence[] = [];
  for (const v of verdicts) {
    for (const e of v.evidence) {
      const key = `${e.kind}::${e.reference}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
  }
  return out;
}

function collectNotes(verdicts: FeatureVerdict[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of verdicts) {
    for (const n of v.notes) {
      if (seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

function buildFeatureStatus(verdicts: FeatureVerdict[]): VenueFeatureStatus {
  const status = pickOverallStatus(verdicts);
  return {
    status,
    confidence: aggregateConfidence(verdicts, status),
    evidence: collectEvidence(verdicts),
    notes: collectNotes(verdicts),
  };
}

export function evaluateRule(profile: MintProfile, rule: VenueRule): VenueCompatibilityResult {
  if (profile.extensions.length === 0) {
    return {
      venue: rule.venue,
      status: "supported",
      source: "heuristic",
      confidence: "high",
      evidence: [],
      notes: [],
    };
  }

  const allVerdicts: { scope: string | undefined; verdict: FeatureVerdict }[] = rule.features
    .map((f) => {
      const verdict = evaluateFeature(profile, f);
      return verdict ? { scope: f.scope, verdict } : null;
    })
    .filter((v): v is { scope: string | undefined; verdict: FeatureVerdict } => v !== null);

  // Unscoped verdicts drive the top-level status (backward-compatible worst-wins).
  const unscopedVerdicts = allVerdicts.filter((v) => v.scope === undefined).map((v) => v.verdict);

  // Scoped verdicts are grouped into the features map.
  const scopedByName = new Map<string, FeatureVerdict[]>();
  for (const { scope, verdict } of allVerdicts) {
    if (scope !== undefined) {
      const existing = scopedByName.get(scope) ?? [];
      existing.push(verdict);
      scopedByName.set(scope, existing);
    }
  }

  const status = pickOverallStatus(unscopedVerdicts);
  const confidence = aggregateConfidence(unscopedVerdicts, status);

  const result: VenueCompatibilityResult = {
    venue: rule.venue,
    status,
    source: "heuristic",
    confidence,
    evidence: collectEvidence(unscopedVerdicts),
    notes: collectNotes(unscopedVerdicts),
  };

  if (scopedByName.size > 0) {
    const features: Record<string, VenueFeatureStatus> = {};
    for (const [scope, verdicts] of scopedByName) {
      features[scope] = buildFeatureStatus(verdicts);
    }
    result.features = features;
  }

  return result;
}
