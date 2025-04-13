# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
FROM node:lts-alpine AS build
WORKDIR /app

# Copy package files and install all dependencies (including dev) for building
COPY package*.json ./
RUN npm install

# Copy the remaining source code and build the project
COPY . .
RUN npm run build

FROM node:lts-alpine
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --production --ignore-scripts

# Copy built files from the build stage
COPY --from=build /app/dist ./dist

# Start the MCP server in MCP mode
CMD [ "npm", "run", "mcp:prod" ]
