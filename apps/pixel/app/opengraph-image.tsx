import { ImageResponse } from "next/og";

// Next.js reads these to emit the og:image meta tags (dimensions + type).
export const alt = "Tarani — Token-2022 compatibility intelligence for Solana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette (from the mark SVGs): dark ink + cream.
const INK = "#1A1714";
const CREAM = "#F5F3EF";
const MUTED = "#A8A29E";

// The Tarani mark, drawn inline so the image is fully self-contained
// (Satori can't fetch external assets).
const MARK_PATH =
  "M 56,16 L 144,16 Q 176,16 176,48 L 176,152 Q 176,184 144,184 L 56,184 Q 24,184 24,152 L 24,48 Q 24,16 56,16 Z M 52,122 L 128,62 L 148,78 L 72,138 Z";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: INK,
        padding: "80px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <svg width="128" height="128" viewBox="0 0 200 200" style={{ marginBottom: 44 }}>
          <path fillRule="evenodd" d={MARK_PATH} fill={CREAM} />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 700,
            color: CREAM,
            letterSpacing: "-0.03em",
          }}
        >
          Tarani
        </div>
        <div style={{ display: "flex", fontSize: 40, color: MUTED, marginTop: 20, maxWidth: 940 }}>
          Token-2022 compatibility intelligence for Solana
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 28, color: MUTED, letterSpacing: "0.02em" }}>
        tarani.io
      </div>
    </div>,
    { ...size },
  );
}
