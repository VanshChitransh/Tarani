import { z } from "zod";
import { MONITOR_EVENT_KINDS, SCENARIO_KINDS, SCENARIO_OUTCOME_VALUES } from "../constants";
import { compatibilityStatusSchema, venueIdSchema } from "./compatibility.schema";

export const scenarioKindSchema = z.enum(SCENARIO_KINDS);

export const scenarioOutcomeSchema = z.enum(SCENARIO_OUTCOME_VALUES);

export const scenarioResultSchema = z.object({
  id: z.string().min(1),
  kind: scenarioKindSchema,
  outcome: scenarioOutcomeSchema,
  summary: z.string().min(1),
  durationMs: z.number().int().nonnegative(),
  failureCode: z.string().optional(),
  logs: z.array(z.string()).optional(),
});

export const simulationReportSchema = z.object({
  mint: z.string().min(32).max(44),
  results: z.array(scenarioResultSchema),
  validatorMode: z.enum(["live", "heuristic"]),
  generatedAt: z.iso.datetime(),
});

export const simulationBadgeDataSchema = z.object({
  mint: z.string().min(32).max(44),
  overall: compatibilityStatusSchema,
  venues: z.array(
    z.object({
      venue: venueIdSchema,
      status: compatibilityStatusSchema,
    }),
  ),
  generatedAt: z.iso.datetime(),
});

export const monitorEventKindSchema = z.enum(MONITOR_EVENT_KINDS);

export const monitorEventSchema = z.object({
  id: z.string().min(1),
  mint: z.string().min(32).max(44),
  kind: monitorEventKindSchema,
  before: z.unknown(),
  after: z.unknown(),
  detectedAt: z.iso.datetime(),
});
