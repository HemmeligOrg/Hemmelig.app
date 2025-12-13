# syntax=docker/dockerfile:1

# Build stage
FROM node:25-slim AS builder
RUN apt-get update && apt-get install -y python3 make g++ openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
ENV NODE_ENV=development
RUN npm ci 
COPY prisma ./prisma
COPY prisma.config.ts ./
# Workaround for node:25-alpine ARM64 environment variable issue with Prisma
ENV DATABASE_URL="file:/app/database/hemmelig.db"
RUN npx prisma generate
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
ENV NODE_ENV=production
# Workaround for node:25-alpine ARM64 environment variable issue with Prisma
ENV DATABASE_URL="file:/app/database/hemmelig.db"
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts && \
    npm rebuild better-sqlite3 && \
    npx prisma generate && \
    npm cache clean --force && \
    rm -rf /root/.npm /tmp/*

# Final image
FROM node:25-slim
RUN apt-get update && apt-get install -y wget openssl ca-certificates gosu && rm -rf /var/lib/apt/lists/* && \
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
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
