import { simulationRequestSchema } from "@tarani/shared";
import { runSimulation } from "./worker/runSimulation";

const PORT = Number(process.env.KOTLER_PORT ?? 3001);

export function startServer(): void {
  Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/health" && req.method === "GET") {
        return Response.json({ ok: true, service: "kotler" });
      }

      if (url.pathname === "/run" && req.method === "POST") {
        let raw: unknown;
        try {
          raw = await req.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = simulationRequestSchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "Invalid request", details: parsed.error.issues },
            { status: 400 },
          );
        }

        try {
          const report = await runSimulation(parsed.data);
          return Response.json({ ok: true, data: report });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      }

      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    },
    error(err) {
      console.error("[kotler] Unhandled server error:", err);
      return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
    },
  });

  console.log(`[kotler] Listening on http://localhost:${PORT}`);
}
