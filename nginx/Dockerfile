# =============================================================================
# Nginx with baked-in frontend assets
# =============================================================================
# Stage 1: Build Angular frontend
FROM node:18-alpine AS builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Nginx with pre-built frontend assets
FROM nginx:1.27-alpine

# Copy built frontend assets directly into the nginx document root
COPY --from=builder /app/dist/ontology-viewer /usr/share/nginx/html
