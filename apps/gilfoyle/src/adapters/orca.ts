import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";

export const orcaAdapter: VenueAdapter = {
  venue: "orca",
  evaluate(input: AdapterInput) {
    return evaluateRule(input.profile, input.rule);
  },
};
