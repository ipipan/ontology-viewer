# =============================================================================
# Frontend Build — Angular Static Assets
# =============================================================================
# This is a build-only container. The compiled assets are placed in
# /app/dist/ontology-viewer, which is mounted as a shared volume by
# docker-compose. The reverse proxy (nginx) serves them directly.
# =============================================================================

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the production bundle
RUN npm run build

# =============================================================================
# Output stage — minimal image that just holds the built assets
# =============================================================================
FROM alpine:3.20

# Copy built assets from builder
COPY --from=builder /app/dist/ontology-viewer /app/dist/ontology-viewer

# The container's only job: keep the volume populated, then exit
CMD ["echo", "Frontend build complete — assets available in /app/dist/ontology-viewer"]