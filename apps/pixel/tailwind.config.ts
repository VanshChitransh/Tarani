import type { Config } from "tailwindcss";

// Colors are remapped to CSS variables (defined in app/globals.css) so the
// whole UI flips between light and dark by toggling `.dark` on <html>. The dark
// palette is Vercel's Geist design system (vercel.com/geist/colors), token for
// token. Channel-triplet format keeps Tailwind's `/opacity` modifiers
// (e.g. `border-white/30`, `ring-neutral-900/10`) working.
//
// Only the steps actually used in the app are remapped. `extend.colors` MERGES
// with Tailwind's defaults, so every other step keeps its stock value.
const varScale = (prefix: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, `rgb(var(--c-${prefix}-${s}) / <alpha-value>)`]));

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--c-white) / <alpha-value>)",
        neutral: varScale("neutral", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        red: varScale("red", [50, 100, 200, 500, 600, 700, 800]),
        green: varScale("green", [50, 100, 200, 500, 700, 800]),
        blue: varScale("blue", [100, 200, 300, 600, 700, 800]),
        yellow: varScale("yellow", [100, 200, 400, 700, 800]),
        amber: varScale("amber", [50, 200, 400, 500, 700, 900]),
        orange: varScale("orange", [100, 200, 400, 500, 700, 800]),
        violet: varScale("violet", [50, 100, 700]),
      },
    },
  },
  plugins: [],
};

export default config;
