import type { z } from "zod";
import type {
  analyzeModeSchema,
  analyzeReportSchema,
  analyzeRequestSchema,
  analyzeResponseSchema,
  apiErrorCodeSchema,
  apiErrorSchema,
  badgeResponseSchema,
  compatibilityDiffKindSchema,
  compatibilityDiffSchema,
  compatibilitySnapshotSchema,
  monitorAckSchema,
  monitorDetailSchema,
  monitorDetailResponseSchema,
  monitorListResponseSchema,
  monitorRecordSchema,
  monitorRequestSchema,
  monitorResponseSchema,
  prelaunchAuthoritiesSchema,
  prelaunchConfigSchema,
  prelaunchExtensionSchema,
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

export type PrelaunchExtension = z.infer<typeof prelaunchExtensionSchema>;
export type PrelaunchAuthorities = z.infer<typeof prelaunchAuthoritiesSchema>;
export type PrelaunchConfig = z.infer<typeof prelaunchConfigSchema>;

export type SimulationRequest = z.infer<typeof simulationRequestSchema>;
export type SimulationResponse = z.infer<typeof simulationResponseSchema>;

export type BadgeResponse = z.infer<typeof badgeResponseSchema>;

export type MonitorRequest = z.infer<typeof monitorRequestSchema>;
export type MonitorAck = z.infer<typeof monitorAckSchema>;
export type MonitorResponse = z.infer<typeof monitorResponseSchema>;
export type MonitorRecord = z.infer<typeof monitorRecordSchema>;
export type MonitorListResponse = z.infer<typeof monitorListResponseSchema>;
export type MonitorDetail = z.infer<typeof monitorDetailSchema>;
export type MonitorDetailResponse = z.infer<typeof monitorDetailResponseSchema>;

export type CompatibilityDiffKind = z.infer<typeof compatibilityDiffKindSchema>;
export type CompatibilityDiff = z.infer<typeof compatibilityDiffSchema>;
export type CompatibilitySnapshot = z.infer<typeof compatibilitySnapshotSchema>;
