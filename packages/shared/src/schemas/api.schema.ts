import { z } from "zod";
import { API_ERROR_CODE_VALUES, COMPATIBILITY_DIFF_KINDS, EXTENSION_KINDS } from "../constants";
import {
  compatibilityStatusSchema,
  venueCompatibilityResultSchema,
  venueIdSchema,
} from "./compatibility.schema";
import { mintProfileSchema } from "./mint.schema";
import { recommendationSchema, riskFindingSchema } from "./risk.schema";
import {
  simulationBadgeDataSchema,
  scenarioKindSchema,
  simulationReportSchema,
} from "./simulation.schema";

export const apiErrorCodeSchema = z.enum(API_ERROR_CODE_VALUES);

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), data }),
    z.object({ ok: z.literal(false), error: apiErrorSchema }),
  ]);

export const analyzeModeSchema = z.enum(["mint", "prelaunch"]);

export const prelaunchExtensionSchema = z.object({
  kind: z.enum(EXTENSION_KINDS),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const prelaunchAuthoritiesSchema = z.object({
  mintRenounced: z.boolean(),
  freezeRenounced: z.boolean(),
  updateRenounced: z.boolean(),
  // Optional for backward compatibility with callers that predate the metadata authority.
  metadataRenounced: z.boolean().optional(),
});

export const prelaunchConfigSchema = z.object({
  extensions: z.array(prelaunchExtensionSchema),
  decimals: z.number().int().min(0).max(9),
  authorities: prelaunchAuthoritiesSchema,
  name: z.string().optional(),
  symbol: z.string().optional(),
});

export const analyzeRequestSchema = z.object({
  mint: z.string().min(32).max(44).optional(),
  mode: analyzeModeSchema.optional(),
  config: prelaunchConfigSchema.optional(),
});

export const analyzeReportSchema = z.object({
  profile: mintProfileSchema,
  compatibility: z.array(venueCompatibilityResultSchema),
  risks: z.array(riskFindingSchema),
  recommendations: z.array(recommendationSchema),
  generatedAt: z.iso.datetime(),
});

export const analyzeResponseSchema = apiResponseSchema(analyzeReportSchema);

export const simulationRequestSchema = z.object({
  mint: z.string().min(32).max(44),
  scenarios: z.array(scenarioKindSchema).optional(),
});

export const simulationResponseSchema = apiResponseSchema(simulationReportSchema);

export const badgeResponseSchema = apiResponseSchema(simulationBadgeDataSchema);

export const monitorRequestSchema = z.object({
  mint: z.string().min(32).max(44),
  subscriberId: z.string().optional(),
});

export const monitorAckSchema = z.object({
  subscriptionId: z.string().min(1),
  mint: z.string().min(32).max(44),
});

export const monitorResponseSchema = apiResponseSchema(monitorAckSchema);

export const monitorRecordSchema = z.object({
  subscriptionId: z.string().min(1),
  mint: z.string().min(32).max(44),
  addedAt: z.iso.datetime(),
  lastCheckedAt: z.iso.datetime().nullable(),
});

export const monitorListResponseSchema = apiResponseSchema(z.array(monitorRecordSchema));

export const compatibilitySnapshotSchema = z.object({
  mint: z.string().min(32).max(44),
  capturedAt: z.iso.datetime(),
  results: z.array(venueCompatibilityResultSchema),
});

export const compatibilityDiffKindSchema = z.enum(COMPATIBILITY_DIFF_KINDS);

export const compatibilityDiffSchema = z.object({
  venue: venueIdSchema,
  kind: compatibilityDiffKindSchema,
  from: compatibilityStatusSchema,
  to: compatibilityStatusSchema,
  detectedAt: z.iso.datetime(),
});

export const monitorDetailSchema = monitorRecordSchema.extend({
  latestSnapshot: compatibilitySnapshotSchema.nullable(),
  latestDiff: z.array(compatibilityDiffSchema).nullable(),
});

export const monitorDetailResponseSchema = apiResponseSchema(monitorDetailSchema);

export const alertWebhookSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  addedAt: z.iso.datetime(),
  active: z.boolean(),
});

export const registerWebhookRequestSchema = z.object({
  url: z.string().url(),
});

export const registerWebhookResponseSchema = apiResponseSchema(alertWebhookSchema);

export const webhookListResponseSchema = apiResponseSchema(z.array(alertWebhookSchema));

export const alertEventSchema = z.object({
  mint: z.string(),
  diffs: z.array(compatibilityDiffSchema),
  detectedAt: z.iso.datetime(),
});

export const badgeDataSchema = z.object({
  mint: z.string(),
  supportedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  blockedCount: z.number().int().nonnegative(),
  grade: z.enum(["A", "B", "C", "F"]),
  generatedAt: z.iso.datetime(),
});
