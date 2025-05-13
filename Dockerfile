# Bare minimum run
# ------------------------------
# $ docker run -p 3000:3000 -d --name=hemmelig \
#   -v ./data/hemmelig/:/var/tmp/hemmelig/upload/files \
#   -v ./database/:/home/node/hemmelig/database/ \
#   hemmeligapp/hemmelig:v5.0.0

# Build stage
FROM node:22-slim AS builder

WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package*.json vite.config.js ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for versioning
ARG GIT_SHA
ARG GIT_TAG
ENV GIT_SHA=${GIT_SHA}
ENV GIT_TAG=${GIT_TAG}
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM node:22-slim AS production

# Install only required system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/hemmelig

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/client/build client/build

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy application files
COPY server.js .env vite.config.js ./
COPY server/ ./server/
COPY shared/ ./shared/
COPY prisma/ ./prisma/
COPY config/ ./config/
COPY public/ ./public/

# Generate Prisma client
RUN npx prisma generate && \
    # Set proper permissions
    chown -R node:node ./

# Expose application port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Use non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

# Start the application
CMD ["npm", "run", "start"]
