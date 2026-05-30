import { createTursoDriver, initDb, configure } from "@tarani/monitor-store";

let initPromise: Promise<void> | null = null;

export function ensureDb(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN ?? "";
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    const driver = createTursoDriver(url, authToken);
    const db = await initDb(driver);
    configure(db);
  })();

  return initPromise;
}
