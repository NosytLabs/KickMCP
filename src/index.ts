import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { JSONRPCServer } from 'json-rpc-2.0';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './api';
import { setupWebSocket } from './services/websocket';
import { logger } from './utils/logger';
import { validateConfig } from './utils/validation';
import { setupCache } from './utils/cache';
import { KickService } from './services/kick';

// Initialize express app
const app = express();
const port = process.env.PORT || 3001;

// Setup middleware
setupMiddleware(app);

// Setup routes
setupRoutes(app);

// Initialize services
const kickService = new KickService();
const cache = setupCache();

// Setup WebSocket server with reconnection handling
const wss = new WebSocketServer({ noServer: true });
setupWebSocket(wss, kickService);

// Health check endpoint (required for serverless)
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version,
    websocket: {
      connected: wss.clients.size,
      pingInterval: process.env.WEBSOCKET_PING_INTERVAL,
      pingTimeout: process.env.WEBSOCKET_PING_TIMEOUT
    }
  };
  res.json(health);
});

// Tools list endpoint (required for Smithery)
app.get('/tools/list', (req, res) => {
  // Return list of available tools without requiring authentication
  res.json({
    tools: [
      {
        name: 'getChannelInfo',
        description: 'Get channel information',
        parameters: {
          type: 'object',
          properties: {
            channelId: {
              type: 'string',
              description: 'Channel ID'
            }
          },
          required: ['channelId']
        }
      },
      // Add other tools here...
    ]
  });
});

// Start server
const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Handle process events
process.on('unhandledRejection', (reason: Error | any) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle serverless timeout
const idleTimeout = Number(process.env.IDLE_TIMEOUT) || 300000;
let lastActivity = Date.now();

// Update last activity on any request
app.use((req, res, next) => {
  lastActivity = Date.now();
  next();
});

// Check for idle timeout
setInterval(() => {
  if (Date.now() - lastActivity > idleTimeout) {
    logger.info('Server idle timeout reached, shutting down');
    process.exit(0);
  }
}, 60000); // Check every minute

export default server;
