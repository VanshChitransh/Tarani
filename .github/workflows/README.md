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

## Required secrets for deployment

Set these in GitHub repo settings -> Secrets and variables -> Actions:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Without these secrets, CD will validate build and skip deploy safely.
