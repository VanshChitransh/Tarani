# Tarani

**Token-2022 compatibility intelligence for Solana.**

Paste any mint address → instant compatibility report across 7 venues (Jupiter, Raydium, Orca, Phantom, Solflare, Solscan, Solana Explorer). Know before you launch whether your token's extensions will cause issues anywhere in the ecosystem.

---

## What it does

- **Compatibility report** — paste any Token-2022 mint address and get a per-venue breakdown: supported, blocked, partial, or conditional
- **Pre-launch mode** — configure a hypothetical token (extensions + decimals) before deploying to preview compatibility issues upfront
- **Risk findings** — ranked list of trust and compatibility risks with actionable recommendations
- **Monitor** — track live compatibility changes for any mint; receive webhook alerts when status changes
- **Embeddable badge** — SVG badge for README or documentation linking to the full report

---

## Architecture

```
apps/
  pixel/        Next.js app — report UI, API routes, badge generation
  gilfoyle/     Compatibility engine — Helius DAS, adapters, risk, recommendations
  kotler/       Simulation worker — solana-test-validator scenarios
  sentinel/     Monitoring worker — recheck loop, diff detection, alert dispatch
packages/
  shared/            Zod schemas and TypeScript types shared across all apps
  monitor-store/     SQLite store for monitored mints, snapshots, diffs, webhooks
```

---

## Prerequisites

- [Bun](https://bun.sh) >= 1.1
- A Helius API key — free tier is sufficient: https://helius.dev

---

## Local setup

```bash
git clone https://github.com/arcinspection/tarani
cd tarani
bun install
cp .env.example apps/pixel/.env.local
# Edit apps/pixel/.env.local and fill in your SOLANA_RPC_URL
cd apps/pixel && bun run dev
# Open http://localhost:3000
```

---

## Running the sentinel (optional — for monitoring)

The sentinel is a long-running process that rechecks tracked mints and fires webhooks on status changes.

```bash
cd apps/sentinel
SOLANA_RPC_URL=<your-helius-url> MONITOR_DB_PATH=../pixel/monitor.db bun run src/index.ts
```

---

## Running tests

```bash
bun run test          # 188 tests across all packages
bun run check:ci      # full gate: lint + typecheck + test + build
```

---

## Deploying to Vercel

1. Create a new Vercel project linked to this repo
2. Set **Root Directory** to `apps/pixel`
3. Set environment variables in the Vercel dashboard:
   - `SOLANA_RPC_URL` — your Helius RPC URL
   - `NEXT_PUBLIC_BASE_URL` — your deployed URL (e.g. `https://your-app.vercel.app`)
   - `HELIUS_API_KEY` — your Helius key
4. For monitoring on Vercel (sentinel runs as a cron): add `vercel.json` with the sentinel tick route (see `apps/pixel/app/api/sentinel/tick/`)

---

## Demo mints

| Mint                                           | Token | What it shows                                                      |
| ---------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | USDC  | Baseline plain SPL — all venues supported                          |
| `CKfatsPMUf8SkiURsDXs7eK6GWb4Jsd6UDbs7twMCWxo` | PYUSD | Transfer Fee extension — Jupiter/Raydium blocked, Orca conditional |
| `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` | WIF   | Popular SPL token with extension profile                           |
