import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";

export const solanaExplorerAdapter: VenueAdapter = {
  venue: "solana-explorer",
  evaluate(input: AdapterInput) {
    return evaluateRule(input.profile, input.rule);
  },
};
