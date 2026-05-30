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

const KNOWN_VALIDATOR_PATHS = [
  "/root/.local/share/solana/install/active_release/bin/solana-test-validator",
  "/home/ubuntu/.local/share/solana/install/active_release/bin/solana-test-validator",
  "/usr/local/bin/solana-test-validator",
];

export function findValidatorBinary(): string | null {
  // Try PATH first (works in user shell)
  const which = spawnSync("which", ["solana-test-validator"]);
  if (which.status === 0) return which.stdout.toString().trim();

  // Fallback: check known Solana install locations (systemd has restricted PATH)
  for (const candidate of KNOWN_VALIDATOR_PATHS) {
    const check = spawnSync("test", ["-x", candidate]);
    if (check.status === 0) return candidate;
  }

  return null;
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
  binary = "solana-test-validator",
): Promise<ChildProcess> {
  const args = ["--rpc-port", String(port), "--quiet"];
  for (const addr of cloneAddresses) {
    args.push("--clone", addr);
  }
  const proc = spawn(binary, args, {
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
