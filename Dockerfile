# syntax=docker/dockerfile:1

FROM node:25-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate
COPY api ./api
COPY src ./src
COPY public ./public
COPY index.html tsconfig*.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY server.ts ./
RUN npm run build

FROM node:25-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

FROM node:25-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/api ./api
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate
RUN mkdir -p /app/database /app/uploads && chown -R app:app /app
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/database/hemmelig.db
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1
ENTRYPOINT ["/app/docker-entrypoint.sh"]
