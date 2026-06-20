import { describe, expect, it } from "vitest";
import { extractLogs, extractErrorMessage, extractFailureCode } from "./logParser";

describe("extractLogs", () => {
  it("returns empty array for non-array input", () => {
    expect(extractLogs(null)).toEqual([]);
    expect(extractLogs(undefined)).toEqual([]);
    expect(extractLogs("string")).toEqual([]);
    expect(extractLogs(42)).toEqual([]);
  });

  it("filters out non-string entries", () => {
    expect(extractLogs(["a", 1, null, "b"])).toEqual(["a", "b"]);
  });

  it("returns all strings from a valid log array", () => {
    const logs = ["Program log: foo", "Program log: bar"];
    expect(extractLogs(logs)).toEqual(logs);
  });
});

describe("extractErrorMessage", () => {
  it("returns undefined when no error line", () => {
    expect(
      extractErrorMessage(["Program log: ok", "Program consumed 1234 compute units"]),
    ).toBeUndefined();
  });

  it("extracts message from Error: prefixed line", () => {
    const logs = ["Program log: doing stuff", "Error: insufficient funds"];
    expect(extractErrorMessage(logs)).toBe("insufficient funds");
  });

  it("is case-insensitive", () => {
    expect(extractErrorMessage(["error: something bad"])).toBe("something bad");
  });

  it("returns first match when multiple error lines", () => {
    const logs = ["Error: first error", "Error: second error"];
    expect(extractErrorMessage(logs)).toBe("first error");
  });
});

describe("extractFailureCode", () => {
  it("returns undefined when no failure code", () => {
    expect(extractFailureCode(["Program log: ok"])).toBeUndefined();
  });

  it("extracts hex failure code", () => {
    const logs = ["Program failed: custom program error: 0x1a"];
    expect(extractFailureCode(logs)).toBe("0x1a");
  });

  it("extracts decimal failure code", () => {
    const logs = ["custom program error: 26"];
    expect(extractFailureCode(logs)).toBe("26");
  });
});
