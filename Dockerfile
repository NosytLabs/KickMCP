# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source files
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set environment variables for serverless
ENV NODE_ENV=production \
    PORT=3001 \
    TZ=Etc/UTC \
    IDLE_TIMEOUT=300000 \
    WEBSOCKET_ENABLED=true \
    WEBSOCKET_PING_INTERVAL=30000 \
    WEBSOCKET_PING_TIMEOUT=5000

# Health check for serverless environment
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE ${PORT}

# Start the server
CMD ["node", "dist/index.js"]

 