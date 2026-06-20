import { describe, expect, it } from "vitest";
import { metadataCheckScenario } from "./metadataCheck";
import { BASE_PROFILE, withMetadata } from "./testHelpers";

describe("metadataCheck heuristic", () => {
  const run = (profile = BASE_PROFILE) => metadataCheckScenario.heuristic({ profile });

  it("returns success for complete metadata", () => {
    const result = run();
    expect(result.kind).toBe("metadata_check");
    expect(result.outcome).toBe("success");
    expect(result.summary).toContain("Test Token");
    expect(result.summary).toContain("TST");
  });

  it("returns blocked when quality is missing", () => {
    const result = run(
      withMetadata({ quality: "missing", name: undefined, symbol: undefined, uri: undefined }),
    );
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NO_METADATA");
  });

  it("returns warning when quality is partial", () => {
    const result = run(withMetadata({ quality: "partial" }));
    expect(result.outcome).toBe("warning");
  });

  it("returns warning when name is missing", () => {
    const result = run(withMetadata({ name: undefined }));
    expect(result.outcome).toBe("warning");
    expect(result.summary).toContain("name");
    expect(result.failureCode).toBe("INCOMPLETE_METADATA");
  });

  it("returns warning when symbol is missing", () => {
    const result = run(withMetadata({ symbol: undefined }));
    expect(result.outcome).toBe("warning");
    expect(result.summary).toContain("symbol");
  });

  it("returns warning when uri is missing", () => {
    const result = run(withMetadata({ uri: undefined }));
    expect(result.outcome).toBe("warning");
    expect(result.summary).toContain("uri");
  });

  it("lists all missing fields in summary", () => {
    const result = run(
      withMetadata({ name: undefined, symbol: undefined, uri: undefined, quality: "partial" }),
    );
    expect(result.summary).toContain("name");
    expect(result.summary).toContain("symbol");
    expect(result.summary).toContain("uri");
  });

  it("live delegates to heuristic and returns same outcome", async () => {
    const hResult = run();
    const lResult = await metadataCheckScenario.live({
      profile: BASE_PROFILE,
      connection: null as never,
      mint: null as never,
      payer: null as never,
      rpcUrl: "",
    });
    expect(lResult.outcome).toBe(hResult.outcome);
    expect(lResult.kind).toBe("metadata_check");
  });
});
