# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with npm ci for consistent builds
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build the application
RUN npm run build:clean

# Production stage
FROM node:18-alpine

# Install required system packages
RUN apk add --no-cache \
    wget \
    curl \
    tini

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user and set permissions
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    NPM_CONFIG_LOGLEVEL=warn \
    NODE_OPTIONS="--max-old-space-size=512" \
    TINI_SUBREAPER=true

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE ${PORT}

# Use tini as init
ENTRYPOINT ["/sbin/tini", "--"]

# Start the server
CMD ["node", "dist/index.js"]

 