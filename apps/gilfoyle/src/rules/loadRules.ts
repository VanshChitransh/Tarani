import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { VENUE_IDS, type VenueId } from "@tarani/shared";
import type { VenueRule } from "./types";

const HERE = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = resolve(HERE, "../../rules");
const SCHEMA_PATH = join(RULES_DIR, "schema/venueRule.schema.json");
const VENUES_DIR = join(RULES_DIR, "venues");

let cachedValidator: ValidateFunction<VenueRule> | null = null;

export class RuleValidationError extends Error {
  readonly path: string;
  readonly issues: unknown;
  constructor(path: string, issues: unknown) {
    super(`Rule file failed schema validation: ${path}`);
    this.name = "RuleValidationError";
    this.path = path;
    this.issues = issues;
  }
}

function getValidator(): ValidateFunction<VenueRule> {
  if (cachedValidator) return cachedValidator;
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  cachedValidator = ajv.compile<VenueRule>(schema);
  return cachedValidator;
}

export function loadVenueRule(venue: VenueId): VenueRule {
  const path = join(VENUES_DIR, `${venue}.json`);
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  const validate = getValidator();
  if (!validate(raw)) {
    throw new RuleValidationError(path, validate.errors);
  }
  return raw as VenueRule;
}

export function loadAllVenueRules(): Record<VenueId, VenueRule> {
  const out = {} as Record<VenueId, VenueRule>;
  for (const venue of VENUE_IDS) {
    out[venue] = loadVenueRule(venue);
  }
  return out;
}

export function listVenueRuleFiles(): string[] {
  return readdirSync(VENUES_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(VENUES_DIR, name));
}
