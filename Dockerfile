# Use the official Bun image as the base image
FROM oven/bun:1 AS builder

# Set working directory
WORKDIR /app

# Install OpenSSL
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN chown -R bun:bun /app

# Install dependencies only when needed
COPY --chown=bun:bun package*.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY --chown=bun:bun . .

# Generate Prisma client
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Build the application
RUN bun build ./app.ts --outdir ./dist --target node

# Production stage
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Install OpenSSL in production
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN chown -R bun:bun /app

# Copy only necessary files from builder
COPY --from=builder --chown=bun:bun /app/dist ./dist
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/package.json ./package.json
COPY --from=builder --chown=bun:bun /app/prisma ./prisma

# Ensure proper permissions for Prisma in production
RUN chown -R bun:bun /app/prisma && \
    chmod -R 755 /app/prisma

# Switch to non-root user
USER bun

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/healthz || exit 1

# Start the application with Prisma migrations
CMD ["sh", "-c", "bunx prisma migrate deploy && bun dist/app.js"]
