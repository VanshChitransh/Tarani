import { createTursoDriver, initDb, configure } from "@tarani/monitor-store";

let initPromise: Promise<void> | null = null;

export function ensureDb(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    const authToken = process.env.TURSO_AUTH_TOKEN ?? "";
    // A remote libSQL/Turso endpoint is useless without an auth token: fail loud
    // here rather than silently connecting with empty credentials and erroring
    // (or worse, silently succeeding against the wrong DB) on first query. A
    // local `file:` URL legitimately needs no token, so only enforce for remote.
    const isRemote = /^(libsql|wss?|https?):\/\//i.test(url);
    if (isRemote && !authToken) {
      throw new Error(
        "TURSO_AUTH_TOKEN is not set but TURSO_DATABASE_URL points at a remote endpoint",
      );
    }
    const driver = createTursoDriver(url, authToken);
    const db = await initDb(driver);
    configure(db);
  })();

  return initPromise;
}
