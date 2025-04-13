FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code
COPY . .

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