import { describe, expect, it } from "vitest";
import type { MintProfile, VenueCompatibilityResult } from "@tarani/shared";
import { scoreRisk } from "./riskEngine";

const BASE_PROFILE: MintProfile = {
  mint: "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv",
  programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  supply: "1000000000",
  decimals: 6,
  extensions: [],
  authorities: {
    mint: { kind: "mint", address: null, isRenounced: true },
    freeze: { kind: "freeze", address: null, isRenounced: true },
    update: { kind: "update", address: null, isRenounced: true },
  },
  metadata: {
    name: "Test Token",
    symbol: "TST",
    quality: "complete",
    hasOnChainName: true,
    hasOnChainSymbol: true,
    decimals: 6,
  },
  warnings: [],
  fetchedAt: "2026-05-28T12:00:00.000Z",
};

const NO_COMPAT: VenueCompatibilityResult[] = [];

function withExtensions(
  kinds: string[],
  params: Record<string, Record<string, unknown>> = {},
): MintProfile {
  return {
    ...BASE_PROFILE,
    extensions: kinds.map((kind) => ({
      kind: kind as MintProfile["extensions"][number]["kind"],
      rawKind: kind,
      parameters: params[kind] ?? {},
      raw: {},
    })),
  };
}

function compatResults(
  overrides: Array<{ venue: string; status: VenueCompatibilityResult["status"] }>,
): VenueCompatibilityResult[] {
  const venues = [
    "jupiter",
    "raydium",
    "orca",
    "phantom",
    "solflare",
    "solscan",
    "solana-explorer",
  ] as const;
  return venues.map((venue) => ({
    venue,
    status: overrides.find((o) => o.venue === venue)?.status ?? "supported",
    source: "heuristic" as const,
    confidence: "high" as const,
    evidence: [],
    notes: [],
  }));
}

// --- Authority checks ---

describe("checkMintAuthorityLive", () => {
  it("fires when mint authority is live", () => {
    const profile: MintProfile = {
      ...BASE_PROFILE,
      authorities: {
        ...BASE_PROFILE.authorities,
        mint: { kind: "mint", address: "11111111111111111111111111111112", isRenounced: false },
      },
    };
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "mint-authority-live")).toBe(true);
  });

  it("does NOT fire when mint authority is renounced", () => {
    const findings = scoreRisk(BASE_PROFILE, NO_COMPAT);
    expect(findings.some((f) => f.id === "mint-authority-live")).toBe(false);
  });
});

describe("checkFreezeAuthorityActive", () => {
  it("fires when freeze authority is active", () => {
    const profile: MintProfile = {
      ...BASE_PROFILE,
      authorities: {
        ...BASE_PROFILE.authorities,
        freeze: { kind: "freeze", address: "11111111111111111111111111111112", isRenounced: false },
      },
    };
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "freeze-authority-active")).toBe(true);
  });
});

describe("checkPermanentDelegatePresentAndActive", () => {
  it("fires when permanentDelegate extension has a delegate address", () => {
    const profile = withExtensions(["permanentDelegate"], {
      permanentDelegate: { delegate: "22mKJkKjGEQ3rampp5YKaSsaYZ52BUkcnUN6evXGHXjT" },
    });
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "permanent-delegate-present")).toBe(true);
  });

  it("does NOT fire when permanentDelegate extension has a null delegate", () => {
    const profile = withExtensions(["permanentDelegate"], {
      permanentDelegate: { delegate: null },
    });
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "permanent-delegate-present")).toBe(false);
  });
});

describe("checkUpdateAuthorityLive", () => {
  it("fires when update authority is live", () => {
    const profile: MintProfile = {
      ...BASE_PROFILE,
      authorities: {
        ...BASE_PROFILE.authorities,
        update: { kind: "update", address: "11111111111111111111111111111112", isRenounced: false },
      },
    };
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "update-authority-live")).toBe(true);
  });

  it("does NOT fire when update authority is renounced", () => {
    const findings = scoreRisk(BASE_PROFILE, NO_COMPAT);
    expect(findings.some((f) => f.id === "update-authority-live")).toBe(false);
  });
});

describe("checkMetadataAuthorityLive", () => {
  it("fires when a live metadata authority is present", () => {
    const profile: MintProfile = {
      ...BASE_PROFILE,
      authorities: {
        ...BASE_PROFILE.authorities,
        metadata: {
          kind: "metadata",
          address: "11111111111111111111111111111112",
          isRenounced: false,
        },
      },
    };
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "metadata-authority-live")).toBe(true);
  });

  it("does NOT fire when there is no metadata authority at all", () => {
    // BASE_PROFILE omits authorities.metadata — absence is not a risk.
    const findings = scoreRisk(BASE_PROFILE, NO_COMPAT);
    expect(findings.some((f) => f.id === "metadata-authority-live")).toBe(false);
  });

  it("does NOT fire when the metadata authority is renounced", () => {
    const profile: MintProfile = {
      ...BASE_PROFILE,
      authorities: {
        ...BASE_PROFILE.authorities,
        metadata: { kind: "metadata", address: null, isRenounced: true },
      },
    };
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "metadata-authority-live")).toBe(false);
  });
});

// --- Extension checks ---

const HOOK_PROGRAM = { transferHook: { program_id: "Hook11111111111111111111111111111111111111" } };

describe("checkNonTransferableWithHook", () => {
  // The program does NOT reject this pair; with a real hook program the hook is just inert on a
  // soulbound mint. LOW-severity "redundant config" finding, not a CRITICAL incompatibility.
  it("fires as a low-severity inert-hook finding when a configured hook is present", () => {
    const profile = withExtensions(["nonTransferable", "transferHook"], HOOK_PROGRAM);
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "non-transferable-hook-inert")).toBe(true);
    expect(findings.find((f) => f.id === "non-transferable-hook-inert")?.severity).toBe("low");
  });

  it("does NOT fire when only one of the pair is present", () => {
    const profile = withExtensions(["nonTransferable"]);
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "non-transferable-hook-inert")).toBe(false);
  });
});

describe("checkConfidentialTransferWithHook", () => {
  // Supported combination — the hook is invoked with u64::MAX. Informational, not critical.
  it("fires as an info-severity amount-blind finding when a configured hook is present", () => {
    const profile = withExtensions(["confidentialTransferMint", "transferHook"], HOOK_PROGRAM);
    const findings = scoreRisk(profile, NO_COMPAT);
    const f = findings.find((x) => x.id === "confidential-hook-amount-blind");
    expect(f).toBeDefined();
    expect(f?.severity).toBe("info");
  });
});

describe("checkTransferHookUnconfigured", () => {
  // M4: a transferHook slot with programId null is a no-op, not an active hook risk.
  it("fires INFO when transferHook is present but has no program set", () => {
    const profile = withExtensions(["confidentialTransferMint", "transferHook"]); // no program_id
    const findings = scoreRisk(profile, NO_COMPAT);
    const f = findings.find((x) => x.id === "transfer-hook-unconfigured");
    expect(f).toBeDefined();
    expect(f?.severity).toBe("info");
    // The configured-hook finding should NOT fire when the hook is unconfigured.
    expect(findings.some((x) => x.id === "confidential-hook-amount-blind")).toBe(false);
  });

  it("does NOT fire when a real hook program is configured", () => {
    const profile = withExtensions(["transferHook"], HOOK_PROGRAM);
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "transfer-hook-unconfigured")).toBe(false);
  });
});

describe("checkScaledUiWithInterestBearing", () => {
  // The ONE genuine mutual exclusion enforced by the program at mint init.
  it("fires CRITICAL when both scaledUiAmountConfig and interestBearingConfig are present", () => {
    const profile = withExtensions(["scaledUiAmountConfig", "interestBearingConfig"]);
    const findings = scoreRisk(profile, NO_COMPAT);
    const f = findings.find((x) => x.id === "incompatible-scaled-ui-interest-bearing");
    expect(f).toBeDefined();
    expect(f?.severity).toBe("critical");
  });

  it("does NOT fire when only one of the pair is present", () => {
    const profile = withExtensions(["scaledUiAmountConfig"]);
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "incompatible-scaled-ui-interest-bearing")).toBe(false);
  });
});

describe("checkConfidentialFeeRequiresFeeConfig", () => {
  it("fires CRITICAL when confidential + fee lack the required ConfidentialTransferFeeConfig", () => {
    const profile = withExtensions(["confidentialTransferMint", "transferFeeConfig"]);
    const findings = scoreRisk(profile, NO_COMPAT);
    const f = findings.find((x) => x.id === "confidential-fee-missing-fee-config");
    expect(f).toBeDefined();
    expect(f?.severity).toBe("critical");
  });

  it("does NOT fire when ConfidentialTransferFeeConfig is present (correctly configured)", () => {
    const profile = withExtensions([
      "confidentialTransferMint",
      "transferFeeConfig",
      "confidentialTransferFeeConfig",
    ]);
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "confidential-fee-missing-fee-config")).toBe(false);
  });
});

// --- Compatibility checks ---

describe("checkBlockedOnAllDexes", () => {
  it("fires only when ALL three DEXes are blocked", () => {
    const compat = compatResults([
      { venue: "jupiter", status: "blocked" },
      { venue: "raydium", status: "blocked" },
      { venue: "orca", status: "blocked" },
    ]);
    const findings = scoreRisk(BASE_PROFILE, compat);
    expect(findings.some((f) => f.id === "blocked-on-all-dexes")).toBe(true);
    expect(findings.some((f) => f.id === "blocked-on-major-dex")).toBe(false);
  });

  it("does NOT fire when only one DEX is blocked", () => {
    const compat = compatResults([{ venue: "jupiter", status: "blocked" }]);
    const findings = scoreRisk(BASE_PROFILE, compat);
    expect(findings.some((f) => f.id === "blocked-on-all-dexes")).toBe(false);
  });
});

describe("checkBlockedOnMajorDex", () => {
  it("fires when Jupiter is blocked but not all DEXes", () => {
    const compat = compatResults([{ venue: "jupiter", status: "blocked" }]);
    const findings = scoreRisk(BASE_PROFILE, compat);
    expect(findings.some((f) => f.id === "blocked-on-major-dex")).toBe(true);
  });
});

// --- Metadata checks ---

describe("checkMissingMetadata", () => {
  it("fires when metadata quality is missing", () => {
    const profile: MintProfile = {
      ...BASE_PROFILE,
      metadata: { ...BASE_PROFILE.metadata, quality: "missing" },
    };
    const findings = scoreRisk(profile, NO_COMPAT);
    expect(findings.some((f) => f.id === "metadata-missing")).toBe(true);
    expect(findings.find((f) => f.id === "metadata-missing")?.severity).toBe("high");
  });
});

// --- Engine invariants ---

describe("scoreRisk engine invariants", () => {
  it("returns deduplicated findings — no duplicate IDs", () => {
    const profile = withExtensions(["nonTransferable", "transferHook", "transferFeeConfig"]);
    const findings = scoreRisk(profile, NO_COMPAT);
    const ids = findings.map((f) => f.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("all findings have required fields: id, category, severity, title, description", () => {
    const profile: MintProfile = {
      ...BASE_PROFILE,
      authorities: {
        ...BASE_PROFILE.authorities,
        mint: { kind: "mint", address: "11111111111111111111111111111112", isRenounced: false },
        freeze: { kind: "freeze", address: "11111111111111111111111111111112", isRenounced: false },
      },
      extensions: [
        { kind: "transferFeeConfig", rawKind: "transfer_fee_config", parameters: {}, raw: {} },
      ],
    };
    const findings = scoreRisk(profile, NO_COMPAT);
    for (const f of findings) {
      expect(f.id).toBeTruthy();
      expect(f.category).toBeTruthy();
      expect(f.severity).toBeTruthy();
      expect(f.title).toBeTruthy();
      expect(f.description).toBeTruthy();
    }
  });

  it("returns findings sorted: critical before high before medium", () => {
    const profile = withExtensions(["nonTransferable", "transferHook", "transferFeeConfig"]);
    const findings = scoreRisk(profile, NO_COMPAT);
    const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    for (let i = 1; i < findings.length; i++) {
      expect(SEVERITY_ORDER[findings[i].severity]).toBeGreaterThanOrEqual(
        SEVERITY_ORDER[findings[i - 1].severity],
      );
    }
  });
});
