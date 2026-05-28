import type {
  CompatibilityEvidence,
  CompatibilityStatus,
  ConfidenceLevel,
  MintProfile,
  VenueCompatibilityResult,
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

function collectEvidence(verdicts: FeatureVerdict[]): CompatibilityEvidence[] {
  return verdicts.flatMap((v) => v.evidence);
}

function collectNotes(verdicts: FeatureVerdict[]): string[] {
  return verdicts.flatMap((v) => v.notes);
}

export function evaluateRule(profile: MintProfile, rule: VenueRule): VenueCompatibilityResult {
  const verdicts: FeatureVerdict[] = rule.features
    .map((f) => evaluateFeature(profile, f))
    .filter((v): v is FeatureVerdict => v !== null);

  const status = pickOverallStatus(verdicts);
  const confidence = aggregateConfidence(verdicts, status);

  return {
    venue: rule.venue,
    status,
    source: "heuristic",
    confidence,
    evidence: collectEvidence(verdicts),
    notes: collectNotes(verdicts),
  };
}
