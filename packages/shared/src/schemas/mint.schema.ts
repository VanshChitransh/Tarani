import { z } from "zod";
import {
  AUTHORITY_KINDS,
  EXTENSION_KINDS,
  METADATA_QUALITY_VALUES,
  PARSER_WARNING_CODES,
} from "../constants";

export const extensionKindSchema = z.enum(EXTENSION_KINDS);

export const detectedExtensionSchema = z.object({
  kind: extensionKindSchema,
  rawKind: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()),
  raw: z.unknown(),
});

export const authorityKindSchema = z.enum(AUTHORITY_KINDS);

export const authorityRecordSchema = z.object({
  kind: authorityKindSchema,
  address: z.string().nullable(),
  isRenounced: z.boolean(),
});

export const authorityProfileSchema = z.object({
  mint: authorityRecordSchema,
  freeze: authorityRecordSchema,
  update: authorityRecordSchema,
  metadata: authorityRecordSchema.optional(),
});

export const metadataQualitySchema = z.enum(METADATA_QUALITY_VALUES);

export const metadataProfileSchema = z.object({
  name: z.string().optional(),
  symbol: z.string().optional(),
  uri: z.string().optional(),
  decimals: z.number().int().min(0).max(255),
  quality: metadataQualitySchema,
  hasOnChainName: z.boolean(),
  hasOnChainSymbol: z.boolean(),
});

export const parserWarningCodeSchema = z.enum(PARSER_WARNING_CODES);

export const parserWarningSchema = z.object({
  code: parserWarningCodeSchema,
  message: z.string().min(1),
  path: z.string().optional(),
});

export const mintProfileSchema = z.object({
  mint: z.string().min(32).max(44),
  programId: z.string().min(32).max(44),
  supply: z.string().regex(/^\d+$/),
  decimals: z.number().int().min(0).max(255),
  extensions: z.array(detectedExtensionSchema),
  authorities: authorityProfileSchema,
  metadata: metadataProfileSchema,
  warnings: z.array(parserWarningSchema),
  fetchedAt: z.iso.datetime(),
});
