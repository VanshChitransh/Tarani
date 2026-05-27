import type { z } from "zod";
import type {
  recommendationSchema,
  riskCategorySchema,
  riskFindingSchema,
  riskSeveritySchema,
} from "../schemas/risk.schema";

export type RiskSeverity = z.infer<typeof riskSeveritySchema>;
export type RiskCategory = z.infer<typeof riskCategorySchema>;
export type RiskFinding = z.infer<typeof riskFindingSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
