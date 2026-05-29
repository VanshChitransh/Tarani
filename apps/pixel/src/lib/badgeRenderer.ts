export interface BadgeInput {
  supportedCount: number;
  totalCount: number;
  blockedCount: number;
}

export function computeGrade(input: BadgeInput): "A" | "B" | "C" | "F" {
  const { supportedCount, totalCount, blockedCount } = input;
  if (blockedCount > 0) return "F";
  if (supportedCount / totalCount >= 0.8) return "A";
  if (supportedCount / totalCount >= 0.5) return "B";
  return "C";
}

const GRADE_COLOR: Record<"A" | "B" | "C" | "F", string> = {
  A: "#22c55e",
  B: "#eab308",
  C: "#f97316",
  F: "#ef4444",
};

export function renderBadgeSvg(input: BadgeInput): string {
  const { supportedCount, totalCount } = input;
  const grade = computeGrade(input);
  const color = GRADE_COLOR[grade];

  const label = "tarani";
  const value = `${supportedCount}/${totalCount} venues`;
  const labelWidth = 52;
  const valueWidth = Math.max(90, value.length * 7);
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

export const UNKNOWN_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="142" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="142" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="52" height="20" fill="#555"/>
    <rect x="52" width="90" height="20" fill="#9ca3af"/>
    <rect width="142" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="26" y="15" fill="#010101" fill-opacity=".3">tarani</text>
    <text x="26" y="14">tarani</text>
    <text x="97" y="15" fill="#010101" fill-opacity=".3">unknown</text>
    <text x="97" y="14">unknown</text>
  </g>
</svg>`;
