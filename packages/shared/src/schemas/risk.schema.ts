import { z } from "zod";
import { RISK_CATEGORIES, RISK_SEVERITY_VALUES } from "../constants";
import { venueIdSchema } from "./compatibility.schema";

export const riskSeveritySchema = z.enum(RISK_SEVERITY_VALUES);

export const riskCategorySchema = z.enum(RISK_CATEGORIES);

export const riskFindingSchema = z.object({
  id: z.string().min(1),
  category: riskCategorySchema,
  severity: riskSeveritySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  affectedVenues: z.array(venueIdSchema).optional(),
});

export const recommendationSchema = z.object({
  id: z.string().min(1),
  riskIds: z.array(z.string().min(1)),
  title: z.string().min(1),
  description: z.string().min(1),
  links: z.array(z.string()).optional(),
});
