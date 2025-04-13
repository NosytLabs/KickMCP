FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files and TypeScript config
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/

# Build the application
RUN npm run build

# Clean up build dependencies
RUN apk del python3 make g++

# Start the server
CMD ["node", "dist/index.js"] 