import type { VenueId } from "@tarani/shared";
import type { VenueRule } from "./types";

import jupiterRule from "../../rules/venues/jupiter.json";
import raydiumRule from "../../rules/venues/raydium.json";
import orcaRule from "../../rules/venues/orca.json";
import phantomRule from "../../rules/venues/phantom.json";
import solflareRule from "../../rules/venues/solflare.json";
import solscanRule from "../../rules/venues/solscan.json";
import solanaExplorerRule from "../../rules/venues/solana-explorer.json";

const RULES: Record<string, VenueRule> = {
  jupiter: jupiterRule as unknown as VenueRule,
  raydium: raydiumRule as unknown as VenueRule,
  orca: orcaRule as unknown as VenueRule,
  phantom: phantomRule as unknown as VenueRule,
  solflare: solflareRule as unknown as VenueRule,
  solscan: solscanRule as unknown as VenueRule,
  "solana-explorer": solanaExplorerRule as unknown as VenueRule,
};

export class RuleValidationError extends Error {
  readonly path: string;
  readonly issues: unknown;
  constructor(path: string, issues: unknown) {
    super(`Rule file failed schema validation: ${path}`);
    this.name = "RuleValidationError";
    this.path = path;
    this.issues = issues;
  }
}

export function loadVenueRule(venue: VenueId): VenueRule {
  const rule = RULES[venue];
  if (!rule) throw new Error(`No rule found for venue: ${venue}`);
  return rule;
}

export function loadAllVenueRules(): Record<VenueId, VenueRule> {
  return { ...RULES } as Record<VenueId, VenueRule>;
}

export function listVenueRuleFiles(): string[] {
  return Object.keys(RULES).map((venue) => `${venue}.json`);
}
