import { JSONRPCServer } from 'json-rpc-2.0';
import { logger } from './utils/logger';
import { setupCache, SimpleCache } from './utils/cache';
import { createRateLimiter, RateLimiter } from './utils/ratelimit';
import { KickService } from './services/kick';
import { setupMCPHandler } from './mcp/handler';

// Environment variables with defaults
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID || '';
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET || '';
const PORT = process.env.PORT || '3000';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const SMITHERY_MODE = process.env.SMITHERY_MODE === 'true';

// Initialize services
const kickService = new KickService();
const cache = setupCache({ ttl: 300, checkPeriod: 600 }); // 5 min TTL, 10 min cleanup

// Validate configuration
function validateConfig(): boolean {
  const isSmitheryMode = SMITHERY_MODE;
  const hasOAuthCredentials = KICK_CLIENT_ID && KICK_CLIENT_SECRET;

  if (!hasOAuthCredentials) {
    if (isSmitheryMode) {
      logger.warn('Running in Smithery mode without OAuth credentials. Some features will be limited.');
    } else {
      logger.warn('KICK_CLIENT_ID or KICK_CLIENT_SECRET is not set. OAuth functionality will be limited.');
    }
  }

  // Log current configuration
  logger.info('Server Configuration:', {
    environment: NODE_ENV,
    port: PORT,
    logLevel: LOG_LEVEL,
    hasOAuthCredentials,
    isSmitheryMode
  });
  
  return true;
}

async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Setup MCP handler
    setupMCPHandler(kickService);

    logger.info('Kick MCP Server started successfully');
    logger.info('Ready to handle MCP requests');

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down server...');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  logger.error('Fatal error during server startup:', error);
  process.exit(1);
});
