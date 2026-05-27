export type CompatibilityStatus = "supported" | "partial" | "blocked" | "conditional" | "unknown";

export type CompatibilitySource = "probe" | "heuristic" | "override";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface AnalyzeRequest {
  mint: string;
  mode?: "mint" | "prelaunch";
}

export interface AnalyzeResponse {
  mint: string;
  generatedAt: string;
}

export interface SimulationRequest {
  mint: string;
}

export interface SimulationResponse {
  mint: string;
  generatedAt: string;
}
