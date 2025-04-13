FROM node:18-alpine

WORKDIR /app

# Copy only essential files
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install and build
RUN npm install && npm run build

# Start the server
CMD ["node", "dist/index.js"] 