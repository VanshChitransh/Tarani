import type { z } from "zod";
import type {
  authorityKindSchema,
  authorityProfileSchema,
  authorityRecordSchema,
  detectedExtensionSchema,
  extensionKindSchema,
  metadataProfileSchema,
  metadataQualitySchema,
  mintProfileSchema,
  parserWarningCodeSchema,
  parserWarningSchema,
} from "../schemas/mint.schema";

export type ExtensionKind = z.infer<typeof extensionKindSchema>;
export type DetectedExtension = z.infer<typeof detectedExtensionSchema>;
export type AuthorityKind = z.infer<typeof authorityKindSchema>;
export type AuthorityRecord = z.infer<typeof authorityRecordSchema>;
export type AuthorityProfile = z.infer<typeof authorityProfileSchema>;
export type MetadataQuality = z.infer<typeof metadataQualitySchema>;
export type MetadataProfile = z.infer<typeof metadataProfileSchema>;
export type ParserWarningCode = z.infer<typeof parserWarningCodeSchema>;
export type ParserWarning = z.infer<typeof parserWarningSchema>;
export type MintProfile = z.infer<typeof mintProfileSchema>;
