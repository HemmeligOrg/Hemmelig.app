# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Generate Prisma client
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Build frontend with Vite and compile server with Bun
RUN bunx --bun vite build && \
    bun build ./server.ts --outdir ./dist --target bun

# Production stage - using alpine for smallest footprint
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./

# Copy pre-built node_modules with native bindings from builder
COPY --from=builder /app/node_modules ./node_modules

# Regenerate Prisma client for production
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Create data directories with proper permissions for database and uploads
RUN mkdir -p /app/data /app/uploads && \
    chown -R bun:bun /app

# Switch to non-root user
USER bun

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check using wget (available in alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1

# Start the application with Prisma migrations
CMD ["sh", "-c", "bunx prisma migrate deploy && bun dist/server.js"]
