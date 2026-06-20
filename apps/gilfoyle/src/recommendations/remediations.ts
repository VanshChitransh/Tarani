import recommendationsFile from "../../rules/recommendations.json";

export type RemediationTemplate = {
  title: string;
  description: string;
  links?: string[];
};

type RemediationRule = RemediationTemplate & { id: string };

export class RemediationValidationError extends Error {
  constructor(message: string) {
    super(`recommendations.json is invalid: ${message}`);
    this.name = "RemediationValidationError";
  }
}

/**
 * Build the id → remediation lookup from the JSON rule file. The JSON is the
 * single source of truth (editable without touching code); this performs a
 * light structural + duplicate-id guard so a bad hand-edit fails loudly at
 * import time rather than silently dropping recommendations. The authoritative
 * shape is enforced by `rules/schema/recommendations.schema.json` via
 * `bun run validate:rules`.
 */
function buildRemediations(): Record<string, RemediationTemplate> {
  const file = recommendationsFile as { rules?: unknown };
  if (!file || !Array.isArray(file.rules)) {
    throw new RemediationValidationError("expected a top-level `rules` array");
  }

  const map: Record<string, RemediationTemplate> = {};
  for (const entry of file.rules as RemediationRule[]) {
    if (!entry || typeof entry.id !== "string" || entry.id.length === 0) {
      throw new RemediationValidationError("every rule needs a non-empty string `id`");
    }
    if (typeof entry.title !== "string" || typeof entry.description !== "string") {
      throw new RemediationValidationError(
        `rule "${entry.id}" needs a string title and description`,
      );
    }
    if (map[entry.id]) {
      throw new RemediationValidationError(`duplicate rule id "${entry.id}"`);
    }
    map[entry.id] = {
      title: entry.title,
      description: entry.description,
      ...(entry.links ? { links: entry.links } : {}),
    };
  }
  return map;
}

export const REMEDIATIONS: Record<string, RemediationTemplate> = buildRemediations();
