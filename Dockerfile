# Multi-stage / lightweight production Dockerfile
FROM node:20-alpine AS base

# Install dumb-init or curl for healthchecks if needed
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching
COPY package*.json ./

# Install only production dependencies reproducibly
RUN npm ci --omit=dev

# Copy application source code
COPY --chown=node:node . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose server port
EXPOSE 3000

# Run as non-privileged node user for security
USER node

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the Node.js Express server
CMD ["node", "server/server.js"]
