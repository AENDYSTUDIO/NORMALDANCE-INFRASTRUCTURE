# Dockerfile for PostgreSQL with custom initialization
FROM postgres:15-alpine@sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b

# Install additional tools
RUN apk add --no-cache curl

# Create directory for init scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY migration.sql /docker-entrypoint-initdb.d/02-migration.sql

# Set proper permissions
RUN chmod 755 /docker-entrypoint-initdb.d/*.sql

# Create non-root user for health checks
RUN addgroup -g 1001 -S postgres && adduser -S pguser -u 1001 -G postgres

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pg_isready -U postgres -d postgres

# Expose port
EXPOSE 5432

# Default command (inherited from base image)
# CMD ["postgres"]