# CI/CD Setup

## Workflows

- `ci.yml`: Runs on pull requests and pushes to `main`.
  - Installs dependencies with Bun
  - Runs quality gates (`lint`, `typecheck`, `test`)
  - Builds all apps

- `cd.yml`: Runs on pushes to `main` and manual dispatch.
  - Installs dependencies with Bun
  - Builds all apps
  - Deploys to Vercel only if secrets are configured

- `rule-freshness.yml`: Runs daily at 09:00 UTC (and on manual dispatch).
  - Runs `bun run check:freshness`, which fails when any venue rule in
    `apps/gilfoyle/rules/venues/*.json` is older than the staleness threshold.
  - A failed scheduled run triggers GitHub's automatic failure email. To receive it:
    Settings -> Notifications -> Actions -> enable email, "send notifications for failed
    workflows only". The email goes to whoever last edited this workflow file on `main`.
  - Note: scheduled workflows only run from the default branch, so this must be merged
    to `main` to start firing.

## Required secrets for deployment

Set these in GitHub repo settings -> Secrets and variables -> Actions:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Without these secrets, CD will validate build and skip deploy safely.
