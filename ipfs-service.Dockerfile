# Multi-stage Dockerfile for IPFS service (Go/Node.js)
# Builder stage for Go compilation
FROM golang:1.21-alpine@sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b AS go-builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o ipfs-service .

# Node.js stage for additional processing if needed
FROM node:18-alpine@sha256:1e3ba0622e8c7fd9e1c2a2e6e1b3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f AS node-builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production --mount=type=cache,target=/root/.npm

# Runtime stage
FROM gcr.io/distroless/static:nonroot@sha256:a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b

# Copy binary from Go builder
COPY --from=go-builder /app/ipfs-service /ipfs-service

# Copy Node.js dependencies if needed
COPY --from=node-builder /app/node_modules ./node_modules

# Create non-root user (distroless already has nonroot)
# USER nonroot:nonroot

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["/ipfs-service", "--health"]

# Start the application
CMD ["/ipfs-service"]