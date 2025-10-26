# Multi-stage Dockerfile for Next.js frontend service
# Builder stage for development dependencies and build
FROM node:18-alpine@sha256:1e3ba0622e8c7fd9e1c2a2e6e1b3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including dev) for build
RUN npm ci --only=production=false --mount=type=cache,target=/root/.npm

# Copy source code
COPY . .

# Build the application
RUN npm run build --mount=type=cache,target=/app/.next/cache

# Runtime stage for production
FROM node:18-alpine@sha256:1e3ba0622e8c7fd9e1c2a2e6e1b3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f AS runtime

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --mount=type=cache,target=/root/.npm && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/next-i18next.config.js ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with tini
CMD ["tini", "--", "npm", "start"]