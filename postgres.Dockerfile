# Dockerfile for PostgreSQL with custom initialization
FROM postgres:18-alpine@sha256:48c8ad3a7284b82be4482a52076d47d879fd6fb084a1cbfccbd551f9331b0e40

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