#!/usr/bin/env bun
import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const HERE = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = resolve(HERE, "../rules/venues");
const SCHEMA_PATH = resolve(HERE, "../rules/schema/venueRule.schema.json");
const RECS_PATH = resolve(HERE, "../rules/recommendations.json");
const RECS_SCHEMA_PATH = resolve(HERE, "../rules/schema/recommendations.schema.json");

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = readdirSync(RULES_DIR)
  .filter((name) => name.endsWith(".json"))
  .map((name) => join(RULES_DIR, name));

if (files.length === 0) {
  console.error("No venue rule files found.");
  process.exit(1);
}

let failures = 0;
for (const file of files) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const ok = validate(data);
  const label = basename(file);
  if (ok) {
    console.log(`ok    ${label}`);
  } else {
    failures++;
    console.error(`fail  ${label}`);
    for (const issue of validate.errors ?? []) {
      console.error(`      ${issue.instancePath || "/"} ${issue.message}`);
    }
  }
}

console.log(`\n${files.length - failures}/${files.length} venue rule files valid.`);

// Validate the recommendations rule file against its schema.
const recsSchema = JSON.parse(readFileSync(RECS_SCHEMA_PATH, "utf8"));
const validateRecs = ajv.compile(recsSchema);
const recsData = JSON.parse(readFileSync(RECS_PATH, "utf8"));
let recsFailed = false;
if (validateRecs(recsData)) {
  console.log("ok    recommendations.json");
} else {
  recsFailed = true;
  console.error("fail  recommendations.json");
  for (const issue of validateRecs.errors ?? []) {
    console.error(`      ${issue.instancePath || "/"} ${issue.message}`);
  }
}

process.exit(failures === 0 && !recsFailed ? 0 : 1);
