# syntax=docker/dockerfile:1

# Base stage with build tools - cached separately
FROM oven/bun:1-alpine AS base-builder
RUN apk add --no-cache python3 make g++ npm

# Build stage
FROM base-builder AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install all dependencies with cache mount for massive speedup
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy prisma schema separately (changes less often than source)
COPY prisma ./prisma

# Generate Prisma client
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Copy source files needed for build
COPY api ./api
COPY src ./src
COPY public ./public
COPY index.html tsconfig*.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY server.ts ./

# Build frontend with Vite and compile server with Bun
RUN bunx --bun vite build && \
    bun build ./server.ts --outdir ./dist --target bun

# Production dependencies stage - reuse base-builder
FROM base-builder AS deps

WORKDIR /app

COPY package.json bun.lock ./

# Install production dependencies only with cache mount
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# Production stage - using alpine for smallest footprint
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Copy production-only node_modules (much smaller than full deps)
COPY --from=deps /app/node_modules ./node_modules

# Regenerate Prisma client for production
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Create data directories with proper permissions for database and uploads
RUN mkdir -p /app/database /app/uploads && \
    chown -R bun:bun /app

# Copy entrypoint script
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/database/hemmelig.db

# Health check using wget (available in alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
