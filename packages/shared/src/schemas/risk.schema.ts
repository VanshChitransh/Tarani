import { z } from "zod";
import { RISK_CATEGORIES, RISK_SEVERITY_VALUES } from "../constants";

export const riskSeveritySchema = z.enum(RISK_SEVERITY_VALUES);

export const riskCategorySchema = z.enum(RISK_CATEGORIES);

export const riskFindingSchema = z.object({
  id: z.string().min(1),
  category: riskCategorySchema,
  severity: riskSeveritySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.array(z.string()).optional(),
});

export const recommendationSchema = z.object({
  id: z.string().min(1),
  category: riskCategorySchema,
  action: z.string().min(1),
  rationale: z.string().min(1),
});
