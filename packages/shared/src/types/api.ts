import type { z } from "zod";
import type {
  analyzeModeSchema,
  analyzeReportSchema,
  analyzeRequestSchema,
  analyzeResponseSchema,
  apiErrorCodeSchema,
  apiErrorSchema,
  badgeResponseSchema,
  monitorAckSchema,
  monitorRequestSchema,
  monitorResponseSchema,
  simulationRequestSchema,
  simulationResponseSchema,
} from "../schemas/api.schema";

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export type AnalyzeMode = z.infer<typeof analyzeModeSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type AnalyzeReport = z.infer<typeof analyzeReportSchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;

export type SimulationRequest = z.infer<typeof simulationRequestSchema>;
export type SimulationResponse = z.infer<typeof simulationResponseSchema>;

export type BadgeResponse = z.infer<typeof badgeResponseSchema>;

export type MonitorRequest = z.infer<typeof monitorRequestSchema>;
export type MonitorAck = z.infer<typeof monitorAckSchema>;
export type MonitorResponse = z.infer<typeof monitorResponseSchema>;
