import type { z } from "zod";
import type {
  compatibilityEvidenceSchema,
  compatibilitySourceSchema,
  compatibilityStatusSchema,
  confidenceLevelSchema,
  venueCompatibilityResultSchema,
  venueFeatureStatusSchema,
  venueIdSchema,
} from "../schemas/compatibility.schema";

export type CompatibilityStatus = z.infer<typeof compatibilityStatusSchema>;
export type CompatibilitySource = z.infer<typeof compatibilitySourceSchema>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type VenueId = z.infer<typeof venueIdSchema>;
export type CompatibilityEvidence = z.infer<typeof compatibilityEvidenceSchema>;
export type VenueFeatureStatus = z.infer<typeof venueFeatureStatusSchema>;
export type VenueCompatibilityResult = z.infer<typeof venueCompatibilityResultSchema>;
