import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";

export const jupiterAdapter: VenueAdapter = {
  venue: "jupiter",
  evaluate(input: AdapterInput) {
    return evaluateRule(input.profile, input.rule);
  },
};
