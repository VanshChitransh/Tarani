# Build context must be the repo root so workspace packages are accessible.
# In Railway: leave "Root Directory" empty, set "Dockerfile Path" to apps/kotler/Dockerfile

FROM oven/bun:1.2-debian

# System deps for Solana CLI installer
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install Solana CLI — provides solana-test-validator
RUN sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Smoke-test: fails the build if the binary isn't on PATH
RUN solana-test-validator --version

WORKDIR /app

# ── dependency layer (cached unless manifests change) ─────────────────────────
COPY package.json bun.lock ./
COPY packages/shared/package.json          packages/shared/package.json
COPY packages/test-fixtures/package.json   packages/test-fixtures/package.json
COPY apps/gilfoyle/package.json            apps/gilfoyle/package.json
COPY apps/kotler/package.json              apps/kotler/package.json

RUN bun install --frozen-lockfile

# ── source ────────────────────────────────────────────────────────────────────
COPY packages/shared       packages/shared
COPY packages/test-fixtures packages/test-fixtures
COPY apps/gilfoyle         apps/gilfoyle
COPY apps/kotler           apps/kotler

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["bun", "run", "apps/kotler/src/index.ts"]
