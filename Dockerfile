# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# Klarte Vie — Web (Next.js 15) · image de production en 3 étapes.
# Build « standalone » : l'image finale ne contient que le serveur minimal
# généré par Next + les assets, pas l'intégralité de node_modules.
# ─────────────────────────────────────────────────────────────────────────────

# ── 1. Dépendances (cache tant que le lockfile ne bouge pas) ──────────────────
FROM node:22-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# ── 2. Build ──────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app
RUN corepack enable

# Variables publiques : Next les INLINE au build → elles doivent être présentes ici.
# NEXT_PUBLIC_TRADE_URL = URL du sous-domaine Klartè Trade (lien « Trading »).
ARG NEXT_PUBLIC_TRADE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_TRADE_URL=$NEXT_PUBLIC_TRADE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── 3. Runtime (image finale, non-root) ───────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3031 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# OCR : Tesseract + langue française (import d'une recette depuis une capture).
RUN apt-get update \
 && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-fra \
 && rm -rf /var/lib/apt/lists/*

# Sortie standalone : serveur (server.js) + deps minimales + assets statiques + public/.
COPY --from=builder            /app/public         ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs
EXPOSE 3031
CMD ["node", "server.js"]
