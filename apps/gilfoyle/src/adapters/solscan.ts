import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";

export const solscanAdapter: VenueAdapter = {
  venue: "solscan",
  evaluate(input: AdapterInput) {
    return evaluateRule(input.profile, input.rule);
  },
};
