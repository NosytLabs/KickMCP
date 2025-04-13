import { createReadStream, createWriteStream } from 'node:fs';
import { JSONRPCServer } from 'json-rpc-2.0';
import { logger } from './utils/logger';
import { setupCache, SimpleCache } from './utils/cache';
import { createRateLimiter, RateLimiter } from './utils/ratelimit';
import { KickService } from './services/kick';
import { HttpServer } from './http/server';
import { setupMCPHandler } from './mcp/handler';

// Environment variables
const KICKAPI_KEY = process.env.KICK_API_KEY || '';
const PORT = parseInt(process.env.PORT || '3001', 10);
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || '60', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10);

// Determine mode based on environment variables
// MCP mode is the default unless HTTP_MODE is explicitly set to true
const isHttpMode = process.env.HTTP_MODE === 'true';
const isMCPMode = !isHttpMode; // Default to MCP mode if HTTP_MODE is not set

// Initialize services
const kickService = new KickService();
const cache = setupCache({ ttl: 300, checkPeriod: 600 }); // 5 min TTL, 10 min cleanup
const rateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW,
  maxRequests: RATE_LIMIT
});

// Server reference
let httpServer: HttpServer | null = null;

// Validate essential configuration
function validateConfig(): boolean {
  // Check if KICK_API_KEY is set
  if (!KICKAPI_KEY) {
    logger.warn('KICK_API_KEY is not set. Some functionality may be limited.');
  }
  
  // Validate port number
  if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    logger.error('Invalid PORT number. Must be between 1 and 65535.');
    return false;
  }
  
  // Validate rate limit
  if (isNaN(RATE_LIMIT) || RATE_LIMIT <= 0) {
    logger.error('Invalid RATE_LIMIT. Must be a positive integer.');
    return false;
  }
  
  // Validate rate limit window
  if (isNaN(RATE_LIMIT_WINDOW) || RATE_LIMIT_WINDOW <= 0) {
    logger.error('Invalid RATE_LIMIT_WINDOW. Must be a positive integer.');
    return false;
  }
  
  return true;
}

// Initialize based on mode
async function startServer(): Promise<void> {
  // Validate configuration
  if (!validateConfig()) {
    process.exit(1);
  }
  
  if (isMCPMode) {
    logger.info('Starting server in MCP mode (stdin/stdout JSON-RPC)');
    setupMCPHandler(kickService);
  } else {
    // Standard HTTP/WebSocket server mode
    logger.info('Starting server in HTTP/WebSocket mode');
    
    // Create and start HTTP server
    httpServer = new HttpServer({
      port: PORT,
      kickService,
      rateLimiter
    });
    
    httpServer.start();
    
    // Handle process events
    process.on('unhandledRejection', (reason: Error | any) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...');
      await shutdown();
      process.exit(0);
    });
    
    // Handle SIGINT for graceful shutdown (Ctrl+C)
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down...');
      await shutdown();
      process.exit(0);
    });
    
    // Handle serverless timeout
    const idleTimeout = Number(process.env.IDLE_TIMEOUT) || 300000; // 5 minutes
    let lastActivity = Date.now();

    // Update last activity periodically
    setInterval(() => {
      if (Date.now() - lastActivity > idleTimeout) {
        logger.info('Server idle timeout reached, shutting down');
        shutdown().then(() => process.exit(0));
      }
    }, 60000); // Check every minute
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Performing graceful shutdown...');
  
  // Stop cache cleanup
  if (cache instanceof SimpleCache) {
    cache.shutdown();
  }
  
  // Stop rate limiter cleanup
  rateLimiter.shutdown();
  
  // Stop HTTP server if running
  if (httpServer) {
    await httpServer.stop();
  }
  
  logger.info('Shutdown complete');
}

// Start the server
startServer().catch(err => {
  logger.error('Failed to start server', err);
  process.exit(1);
});

// Export server for testing
export default httpServer;
