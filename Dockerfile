FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files and TypeScript config
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for TypeScript)
RUN npm install

# Copy source files
COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/

# Create dist directory
RUN mkdir -p dist

# Build TypeScript
RUN npm run build

# Clean up build dependencies and source files
RUN apk del python3 make g++ && \
    rm -rf src/ config/ scripts/ .gitignore .dockerignore .eslintrc.json .prettierrc tsconfig.json

# Install production dependencies only
RUN npm ci --only=production

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"] 