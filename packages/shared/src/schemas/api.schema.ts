import { z } from "zod";
import { API_ERROR_CODE_VALUES } from "../constants";
import { venueCompatibilityResultSchema } from "./compatibility.schema";
import { mintProfileSchema } from "./mint.schema";
import { recommendationSchema, riskFindingSchema } from "./risk.schema";
import { badgeDataSchema, scenarioKindSchema, simulationReportSchema } from "./simulation.schema";

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

export const analyzeRequestSchema = z.object({
  mint: z.string().min(32).max(44),
  mode: analyzeModeSchema.optional(),
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

export const badgeResponseSchema = apiResponseSchema(badgeDataSchema);

export const monitorRequestSchema = z.object({
  mint: z.string().min(32).max(44),
  subscriberId: z.string().optional(),
});

export const monitorAckSchema = z.object({
  subscriptionId: z.string().min(1),
  mint: z.string().min(32).max(44),
});

export const monitorResponseSchema = apiResponseSchema(monitorAckSchema);
