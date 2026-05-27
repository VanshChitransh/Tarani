import type { z } from "zod";
import type {
  badgeDataSchema,
  monitorEventKindSchema,
  monitorEventSchema,
  scenarioKindSchema,
  scenarioOutcomeSchema,
  scenarioResultSchema,
  simulationReportSchema,
} from "../schemas/simulation.schema";

export type ScenarioKind = z.infer<typeof scenarioKindSchema>;
export type ScenarioOutcome = z.infer<typeof scenarioOutcomeSchema>;
export type ScenarioResult = z.infer<typeof scenarioResultSchema>;
export type SimulationReport = z.infer<typeof simulationReportSchema>;
export type BadgeData = z.infer<typeof badgeDataSchema>;
export type MonitorEventKind = z.infer<typeof monitorEventKindSchema>;
export type MonitorEvent = z.infer<typeof monitorEventSchema>;
