# syntax=docker/dockerfile:1
# Next.js standalone image for english-platform. Built for linux/arm64 (gary's
# OCI ARM server). better-sqlite3 is compiled from source in the deps stage.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# --- deps: install all deps; better-sqlite3 native addon compiles here ---
FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --frozen-lockfile still pins exact versions + integrity hashes; we only relax
# the just-published "release age" cooldown so daily browserslist data packages
# (caniuse-lite, electron-to-chromium) don't block a same-day build.
RUN pnpm install --frozen-lockfile --config.minimumReleaseAge=0

# --- builder: produce the standalone server ---
FROM deps AS builder
WORKDIR /app
COPY . .
ARG NEXT_BASE_PATH=/english
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- runner: minimal standalone + data files for boot-time migrate/seed ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_PATH=/app/data/app.db

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# standalone output (includes traced node_modules + better-sqlite3 .node)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# data read at runtime by instrumentation (migrate + seed)
COPY --from=builder --chown=nextjs:nodejs /app/drizzle/migrations ./drizzle/migrations
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
VOLUME /app/data
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
