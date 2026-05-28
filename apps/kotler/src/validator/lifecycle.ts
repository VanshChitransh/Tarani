import { spawn, spawnSync, type ChildProcess } from "child_process";
import { createConnection } from "net";

export class ValidatorBootTimeoutError extends Error {
  constructor(port: number, timeoutMs: number) {
    super(`solana-test-validator did not become ready on port ${port} within ${timeoutMs}ms`);
    this.name = "ValidatorBootTimeoutError";
  }
}

export interface ValidatorHandle {
  rpcUrl: string;
  port: number;
  stop: () => void;
}

export async function isValidatorBinaryAvailable(): Promise<boolean> {
  const proc = spawnSync("which", ["solana-test-validator"]);
  return proc.status === 0;
}

export async function findFreePort(start = 8899): Promise<number> {
  for (let port = start; port < start + 100; port++) {
    const free = await new Promise<boolean>((resolve) => {
      const s = createConnection(port, "127.0.0.1");
      s.on("connect", () => {
        s.destroy();
        resolve(false);
      });
      s.on("error", () => resolve(true));
    });
    if (free) return port;
  }
  throw new Error("No free port found in range");
}

export async function startValidator(
  port: number,
  cloneAddresses: string[] = [],
): Promise<ChildProcess> {
  const args = ["--rpc-port", String(port), "--quiet"];
  for (const addr of cloneAddresses) {
    args.push("--clone", addr);
  }
  const proc = spawn("solana-test-validator", args, {
    stdio: "ignore",
    detached: false,
  });
  return proc;
}

export async function waitForValidator(port: number, timeoutMs = 30_000): Promise<void> {
  const rpcUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
        signal: AbortSignal.timeout(2_000),
      });
      const json = (await res.json()) as { result?: string };
      if (json.result === "ok") return;
    } catch {
      // still booting
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  }
  throw new ValidatorBootTimeoutError(port, timeoutMs);
}

export function stopValidator(proc: ChildProcess): void {
  try {
    proc.kill("SIGTERM");
  } catch {
    // already gone
  }
}
