import type { z } from "zod";
import type {
  simulationBadgeDataSchema,
  monitorEventKindSchema,
  monitorEventSchema,
  scenarioKindSchema,
  scenarioOutcomeSchema,
  scenarioModeSchema,
  scenarioResultSchema,
  simulationReportSchema,
} from "../schemas/simulation.schema";

export type ScenarioKind = z.infer<typeof scenarioKindSchema>;
export type ScenarioOutcome = z.infer<typeof scenarioOutcomeSchema>;
export type ScenarioMode = z.infer<typeof scenarioModeSchema>;
export type ScenarioResult = z.infer<typeof scenarioResultSchema>;
export type SimulationReport = z.infer<typeof simulationReportSchema>;
export type SimulationBadgeData = z.infer<typeof simulationBadgeDataSchema>;
export type MonitorEventKind = z.infer<typeof monitorEventKindSchema>;
export type MonitorEvent = z.infer<typeof monitorEventSchema>;
