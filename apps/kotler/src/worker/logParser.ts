const LOG_ERR_RE = /Error:\s*(.+)/i;
const FAILURE_CODE_RE = /custom program error:\s*(0x[0-9a-f]+|\d+)/i;

export function extractLogs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((l): l is string => typeof l === "string");
}

export function extractErrorMessage(logs: string[]): string | undefined {
  for (const line of logs) {
    const m = LOG_ERR_RE.exec(line);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

export function extractFailureCode(logs: string[]): string | undefined {
  for (const line of logs) {
    const m = FAILURE_CODE_RE.exec(line);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}
