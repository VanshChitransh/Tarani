import { HeliusClient, parseMintProfile, runCompatibilityEngine } from "@tarani/gilfoyle";
import { renderBadgeSvg, UNKNOWN_BADGE_SVG } from "../../../../src/lib/badgeRenderer";

export async function GET(_req: Request, { params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;

  const asset = await (async () => new HeliusClient().fetchMintAsset(mint))().catch(() => null);

  if (!asset) {
    return new Response(UNKNOWN_BADGE_SVG, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const profile = parseMintProfile(asset);
  const results = await runCompatibilityEngine(profile);

  const supportedCount = results.filter(
    (r) => r.status === "supported" || r.status === "partial",
  ).length;
  const blockedCount = results.filter((r) => r.status === "blocked").length;
  const totalCount = results.length;

  const svg = renderBadgeSvg({ supportedCount, blockedCount, totalCount });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300",
    },
  });
}
