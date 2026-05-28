import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";

export const phantomAdapter: VenueAdapter = {
  venue: "phantom",
  evaluate(input: AdapterInput) {
    return evaluateRule(input.profile, input.rule);
  },
};
