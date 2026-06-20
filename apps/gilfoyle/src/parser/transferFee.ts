import type { DetectedExtension } from "@tarani/shared";

export interface TransferFeeRate {
  /** Current (newer) fee in basis points, or undefined if unreadable. */
  basisPoints: number | undefined;
  /** Current (newer) maximum fee in base units, or undefined if unreadable. */
  maximumFee: bigint | undefined;
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10);
  return undefined;
}

function toBigInt(v: unknown): bigint | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return BigInt(Math.trunc(v));
  if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
  if (typeof v === "bigint") return v;
  return undefined;
}

/**
 * Single source of truth for reading the active transfer fee from a detected
 * TransferFeeConfig extension. Helius DAS nests the current rate under
 * `newer_transfer_fee.{transfer_fee_basis_points,maximum_fee}` (snake_case);
 * some shapes (and hand-built fixtures) flatten it to
 * `{transferFeeBasisPoints,maximumFee}` at the top level. We tolerate both so
 * the risk engine (zero-fee detection) and the simulator (building a faithful
 * test mint + measuring withheld fee) read the same correct value — previously
 * both read the wrong key and always saw 0 bps.
 */
export function readTransferFeeConfig(ext: DetectedExtension | undefined): TransferFeeRate {
  if (!ext) return { basisPoints: undefined, maximumFee: undefined };
  const newer = ext.parameters["newer_transfer_fee"] ?? ext.parameters["newerTransferFee"];
  const src =
    newer && typeof newer === "object" ? (newer as Record<string, unknown>) : ext.parameters;
  return {
    basisPoints: toNumber(src["transfer_fee_basis_points"] ?? src["transferFeeBasisPoints"]),
    maximumFee: toBigInt(src["maximum_fee"] ?? src["maximumFee"]),
  };
}
