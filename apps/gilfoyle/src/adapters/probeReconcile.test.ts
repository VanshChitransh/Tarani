import { describe, expect, it } from "vitest";
import type {
  CompatibilityEvidence,
  CompatibilityStatus,
  VenueCompatibilityResult,
} from "@tarani/shared";
import { reconcileProbe } from "./probeReconcile";

const probeEvidence: CompatibilityEvidence = {
  kind: "probe",
  reference: "Test Pool API",
  snippet: "probe ran",
  observedAt: "2026-05-31T00:00:00.000Z",
};

function base(status: CompatibilityStatus): VenueCompatibilityResult {
  return {
    venue: "raydium",
    status,
    source: "heuristic",
    confidence: "high",
    evidence: [{ kind: "doc", reference: "rule-doc", observedAt: "2026-05-31T00:00:00.000Z" }],
    notes: ["rule note"],
  };
}

describe("reconcileProbe", () => {
  it("leaves the verdict completely untouched when the probe is unknown", () => {
    const r = reconcileProbe(base("blocked"), "unknown", probeEvidence);
    expect(r.status).toBe("blocked");
    expect(r.source).toBe("heuristic");
    expect(r.evidence).toHaveLength(1); // no probe evidence appended
  });

  // A live pool/route is ground truth: it overrides ANY worse-than-supported verdict.
  it.each<CompatibilityStatus>(["blocked", "conditional", "partial", "unknown"])(
    "upgrades %s -> supported when a live market exists",
    (status) => {
      const r = reconcileProbe(base(status), "exists", probeEvidence);
      expect(r.status).toBe("supported");
      expect(r.source).toBe("probe");
      expect(r.confidence).toBe("high");
      expect(r.evidence.some((e) => e.kind === "probe")).toBe(true);
      expect(r.notes.some((n) => n.includes("Overridden to supported"))).toBe(true);
    },
  );

  it("keeps supported as supported when a live market exists (just adds evidence)", () => {
    const r = reconcileProbe(base("supported"), "exists", probeEvidence);
    expect(r.status).toBe("supported");
    expect(r.source).toBe("probe");
    expect(r.evidence.some((e) => e.kind === "probe")).toBe(true);
  });

  it("downgrades supported -> partial when no live market exists", () => {
    const r = reconcileProbe(base("supported"), "absent", probeEvidence);
    expect(r.status).toBe("partial");
    expect(r.source).toBe("probe");
    expect(r.evidence.some((e) => e.kind === "probe")).toBe(true);
  });

  // Absence never fabricates support, and never improves a non-supported rule verdict.
  it.each<CompatibilityStatus>(["blocked", "conditional", "partial", "unknown"])(
    "leaves %s unchanged (status) when no live market exists, only attaching evidence",
    (status) => {
      const r = reconcileProbe(base(status), "absent", probeEvidence);
      expect(r.status).toBe(status);
      expect(r.source).toBe("probe");
      expect(r.evidence.some((e) => e.kind === "probe")).toBe(true);
    },
  );
});
