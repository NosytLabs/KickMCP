FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/

# Build TypeScript
RUN npm run build

# Clean up devDependencies
RUN npm ci --only=production

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"] 