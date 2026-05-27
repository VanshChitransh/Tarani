#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { listVenueRuleFiles } from "../src/rules";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(HERE, "../rules/schema/venueRule.schema.json");

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = listVenueRuleFiles();
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
process.exit(failures === 0 ? 0 : 1);
