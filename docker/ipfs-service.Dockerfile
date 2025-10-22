# Multi-stage Dockerfile for IPFS/Helia service
FROM node:20-alpine AS base
RUN apk add --no-cache ca-certificates curl git
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ipfs
RUN mkdir -p /data/ipfs && chown ipfs:nodejs /data/ipfs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=ipfs:nodejs /app/dist ./dist
COPY --from=builder /app/package*.json ./

USER ipfs
EXPOSE 4001 5001 8080
ENV IPFS_PATH=/data/ipfs

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/ipfs-service.js"]