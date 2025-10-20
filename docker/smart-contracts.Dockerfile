# Multi-stage Dockerfile for Smart Contracts
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:contracts

# Production stage
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 contracts

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=contracts:nodejs /app/artifacts ./artifacts
COPY --from=builder --chown=contracts:nodejs /app/contracts ./contracts
COPY --from=builder /app/package*.json ./

USER contracts
EXPOSE 8545

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8545/health || exit 1

CMD ["npm", "run", "start:contracts"]