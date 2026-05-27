#!/usr/bin/env bun
import { mintProfileSchema } from "@tarani/shared";
import { HeliusClient, HeliusClientError } from "../src/helius";
import { parseMintProfile } from "../src/parser";

async function main() {
  const mint = process.argv[2];
  if (!mint) {
    console.error("Usage: bun run scripts/smoke-parse.ts <MINT_ADDRESS>");
    process.exit(2);
  }

  const client = new HeliusClient();
  let asset;
  try {
    asset = await client.fetchMintAsset(mint);
  } catch (err) {
    if (err instanceof HeliusClientError) {
      console.error(`[${err.code}] ${err.message}`);
      if (err.details) console.error("details:", err.details);
      process.exit(1);
    }
    throw err;
  }

  const profile = parseMintProfile(asset);
  const validation = mintProfileSchema.safeParse(profile);
  if (!validation.success) {
    console.error("Parser output failed schema validation:");
    console.error(JSON.stringify(validation.error.issues, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(profile, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
