// Minimal Bun ambient types for tsc compatibility.
// Replace with `bun-types` package when adding to devDependencies.
declare namespace Bun {
  interface ServeOptions {
    port?: number;
    fetch(req: Request): Response | Promise<Response>;
    error?(err: Error): Response | Promise<Response>;
  }
  function serve(options: ServeOptions): void;
}
