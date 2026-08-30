# syntax=docker/dockerfile:1

# Prisma client generation stage - runs on native architecture to avoid QEMU issues
FROM --platform=$BUILDPLATFORM node:25-slim AS prisma-gen
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL="file:/app/database/hemmelig.db"
RUN npx prisma generate --schema=prisma/schema.prisma --generator client

# Build stage
FROM node:25-slim AS builder
RUN apt-get update && apt-get install -y python3 make g++ openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
ENV NODE_ENV=development
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
# Copy pre-generated Prisma client from native build
COPY --from=prisma-gen /app/prisma/generated ./prisma/generated
COPY api ./api
COPY src ./src
COPY public ./public
COPY index.html tsconfig*.json vite.config.ts tailwind.config.js ./
COPY server.ts ./
RUN npm run build

# Production dependencies
FROM node:25-slim AS deps
RUN apt-get update && apt-get install -y python3 make g++ openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
# Copy pre-generated Prisma client from native build
COPY --from=prisma-gen /app/prisma/generated ./prisma/generated
ENV NODE_ENV=production
RUN npm ci --omit=dev --ignore-scripts && \
    npm rebuild better-sqlite3 && \
    npm cache clean --force && \
    rm -rf /root/.npm /tmp/*

# Final image
FROM node:25-slim
RUN apt-get update && apt-get install -y wget openssl ca-certificates && rm -rf /var/lib/apt/lists/* && \
    groupadd -r app && useradd -r -g app -m -d /home/app app
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/api ./api
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY --from=builder /app/prisma.config.ts ./
COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma/generated ./prisma/generated
RUN mkdir -p /app/database /app/uploads && chown -R app:app /app
COPY --chown=app:app scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/database/hemmelig.db

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/ready || exit 1

USER app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
