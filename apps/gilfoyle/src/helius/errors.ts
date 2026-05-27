import type { ApiErrorCode } from "@tarani/shared";

export class HeliusClientError extends Error {
  readonly code: ApiErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ApiErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "HeliusClientError";
    this.code = code;
    this.details = details;
  }
}

export function isRetriable(code: ApiErrorCode): boolean {
  return code === "UPSTREAM_TIMEOUT" || code === "UPSTREAM_ERROR";
}
