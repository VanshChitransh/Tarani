import { z } from "zod";
import {
  COMPATIBILITY_EVIDENCE_KINDS,
  COMPATIBILITY_SOURCE_VALUES,
  COMPATIBILITY_STATUS_VALUES,
  CONFIDENCE_LEVEL_VALUES,
  VENUE_IDS,
} from "../constants";

export const compatibilityStatusSchema = z.enum(COMPATIBILITY_STATUS_VALUES);

export const compatibilitySourceSchema = z.enum(COMPATIBILITY_SOURCE_VALUES);

export const confidenceLevelSchema = z.enum(CONFIDENCE_LEVEL_VALUES);

export const venueIdSchema = z.enum(VENUE_IDS);

export const compatibilityEvidenceSchema = z.object({
  kind: z.enum(COMPATIBILITY_EVIDENCE_KINDS),
  reference: z.string().min(1),
  snippet: z.string().optional(),
  observedAt: z.iso.datetime(),
});

export const venueFeatureStatusSchema = z.object({
  status: compatibilityStatusSchema,
  confidence: confidenceLevelSchema,
  evidence: z.array(compatibilityEvidenceSchema),
  notes: z.array(z.string()),
});

export const venueCompatibilityResultSchema = z.object({
  venue: venueIdSchema,
  status: compatibilityStatusSchema,
  source: compatibilitySourceSchema,
  confidence: confidenceLevelSchema,
  evidence: z.array(compatibilityEvidenceSchema),
  notes: z.array(z.string()),
  features: z.record(z.string(), venueFeatureStatusSchema).optional(),
});
