# Multi-stage Dockerfile for Smart Contracts service (Solidity/Hardhat)
# Builder stage for development dependencies and build
FROM node:18-alpine@sha256:1e3ba0622e8c7fd9e1c2a2e6e1b3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f AS builder

# Install build dependencies
RUN apk add --no-cache git python3 make g++ jq

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including dev) for build
RUN npm ci --only=production=false --mount=type=cache,target=/root/.npm

# Copy source code
COPY . .

# Build the contracts
RUN npx hardhat compile

# Runtime stage for production
FROM node:18-alpine@sha256:1e3ba0622e8c7fd9e1c2a2e6e1b3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f AS runtime

# Install tini for proper signal handling
RUN apk add --no-cache tini jq

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S smartcontracts -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --mount=type=cache,target=/root/.npm && npm cache clean --force

# Copy built contracts and scripts from builder stage
COPY --from=builder --chown=smartcontracts:nodejs /app/artifacts ./artifacts
COPY --from=builder --chown=smartcontracts:nodejs /app/contracts ./contracts
COPY --from=builder --chown=smartcontracts:nodejs /app/scripts ./scripts
COPY --from=builder --chown=smartcontracts:nodejs /app/hardhat.config.ts ./

# Switch to non-root user
USER smartcontracts

# Expose port
EXPOSE 8545

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8545/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with tini
CMD ["tini", "--", "npx", "hardhat", "node"]