import { describe, expect, it } from "vitest";
import { computeGrade, renderBadgeSvg } from "./badgeRenderer";

describe("computeGrade", () => {
  it("returns F when blockedCount > 0 regardless of supported count", () => {
    expect(computeGrade({ supportedCount: 7, totalCount: 7, blockedCount: 1 })).toBe("F");
  });

  it("returns A when supportedCount / totalCount >= 0.8 and no blocked", () => {
    expect(computeGrade({ supportedCount: 7, totalCount: 7, blockedCount: 0 })).toBe("A");
  });

  it("returns B when ratio >= 0.5 and < 0.8 and no blocked", () => {
    expect(computeGrade({ supportedCount: 4, totalCount: 7, blockedCount: 0 })).toBe("B");
  });

  it("returns C when ratio < 0.5 and no blocked", () => {
    expect(computeGrade({ supportedCount: 2, totalCount: 7, blockedCount: 0 })).toBe("C");
  });
});

describe("renderBadgeSvg", () => {
  it("output contains <svg", () => {
    const svg = renderBadgeSvg({ supportedCount: 5, totalCount: 7, blockedCount: 0 });
    expect(svg).toContain("<svg");
  });

  it("output contains tarani label", () => {
    const svg = renderBadgeSvg({ supportedCount: 5, totalCount: 7, blockedCount: 0 });
    expect(svg).toContain("tarani");
  });

  it("output contains correct X/Y venues text", () => {
    const svg = renderBadgeSvg({ supportedCount: 3, totalCount: 7, blockedCount: 0 });
    expect(svg).toContain("3/7 venues");
  });

  it("grade F badge contains color #ef4444", () => {
    const svg = renderBadgeSvg({ supportedCount: 0, totalCount: 7, blockedCount: 1 });
    expect(svg).toContain("#ef4444");
  });

  it("grade A badge contains color #22c55e", () => {
    const svg = renderBadgeSvg({ supportedCount: 7, totalCount: 7, blockedCount: 0 });
    expect(svg).toContain("#22c55e");
  });
});
