import { JSONRPCServer } from 'json-rpc-2.0';
import { logger } from './utils/logger';
import { setupCache, SimpleCache } from './utils/cache';
import { createRateLimiter, RateLimiter } from './utils/ratelimit';
import { KickService } from './services/kick';
import { setupMCPHandler } from './mcp/handler';

// Environment variables
const KICKAPI_KEY = process.env.KICK_API_KEY || '';

// Initialize services
const kickService = new KickService();
const cache = setupCache({ ttl: 300, checkPeriod: 600 }); // 5 min TTL, 10 min cleanup

// Validate essential configuration
function validateConfig(): boolean {
  // Check if KICK_API_KEY is set
  if (!KICKAPI_KEY) {
    logger.warn('KICK_API_KEY is not set. Some functionality may be limited.');
  }
  
  return true;
}

async function startServer(): Promise<void> {
  try {
    // Validate configuration
    if (!validateConfig()) {
      process.exit(1);
    }

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
