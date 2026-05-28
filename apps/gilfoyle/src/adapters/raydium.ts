import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";

export const raydiumAdapter: VenueAdapter = {
  venue: "raydium",
  evaluate(input: AdapterInput) {
    return evaluateRule(input.profile, input.rule);
  },
};
