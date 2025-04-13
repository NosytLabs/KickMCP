# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with cache mount and ignore scripts
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts && \
    npm cache clean --force

# Copy source files
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies with cache mount and ignore scripts
RUN --mount=type=cache,target=/root/.npm-production npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    TZ=Etc/UTC \
    SHELL=/bin/sh \
    PUBLIC_ENDPOINTS="/tools/list,/initialize,/health" \
    IDLE_TIMEOUT=300000

# Set proper permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE ${PORT}

# Start the server
CMD ["node", "dist/index.js"]

 