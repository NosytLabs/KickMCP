import http from 'node:http';
import { URL } from 'node:url';
import { logger } from '../utils/logger';
import { RateLimiter } from '../utils/ratelimit';
import { KickService } from '../services/kick';
import { WebSocketServer, WebSocket } from 'ws';

export interface HttpServerOptions {
  port: number;
  kickService: KickService;
  rateLimiter: RateLimiter;
}

interface HttpContext {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  url: URL;
  method: string;
  path: string;
  query: Record<string, string>;
  ip: string;
  body: any;
}

export class HttpServer {
  private server: http.Server;
  private port: number;
  private kickService: KickService;
  private rateLimiter: RateLimiter;
  private wss: WebSocketServer;
  private routes: Map<string, (ctx: HttpContext) => Promise<void>> = new Map();

  constructor(options: HttpServerOptions) {
    this.port = options.port;
    this.kickService = options.kickService;
    this.rateLimiter = options.rateLimiter;

    // Create HTTP server
    this.server = http.createServer(this.handleRequest.bind(this));
    
    // Setup WebSocket server
    this.wss = new WebSocketServer({ noServer: true });
    
    // Register built-in routes
    this.setupRoutes();
  }

  /**
   * Start the HTTP server
   */
  start(): void {
    this.server.listen(this.port, () => {
      logger.info(`HTTP server running on port ${this.port}`);
    });

    // Handle WebSocket upgrade
    this.server.on('upgrade', (request, socket, head) => {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
        
        // Setup WebSocket handling
        this.handleWebSocketConnection(ws, request);
      });
    });
  }
  
  /**
   * Register a route handler
   */
  registerRoute(method: string, path: string, handler: (ctx: HttpContext) => Promise<void>): void {
    const routeKey = `${method.toUpperCase()}:${path}`;
    this.routes.set(routeKey, handler);
    logger.debug(`Registered route: ${routeKey}`);
  }

  /**
   * Setup built-in routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.registerRoute('GET', '/health', async (ctx) => {
      // Get memory usage with human-readable format
      const memoryUsage = process.memoryUsage();
      const formatMemory = (bytes: number) => `${Math.round(bytes / 1024 / 1024 * 100) / 100}MB`;
      
      // Attempt to check the Kick API status
      let apiStatus = 'unknown';
      try {
        await this.kickService.getCategories({ limit: 1 });
        apiStatus = 'ok';
      } catch (error) {
        apiStatus = 'error';
        logger.error('Health check: Kick API status check failed', error);
      }
      
      const health = {
        status: 'ok',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: {
          node: process.version,
          env: process.env.NODE_ENV || 'development'
        },
        memory: {
          rss: formatMemory(memoryUsage.rss),
          heapTotal: formatMemory(memoryUsage.heapTotal),
          heapUsed: formatMemory(memoryUsage.heapUsed),
          external: formatMemory(memoryUsage.external)
        },
        websocket: {
          connected: this.wss.clients.size
        },
        api: {
          status: apiStatus,
          baseUrl: process.env.KICK_API_BASE_URL || 'https://kick.com/api/v2'
        }
      };
      
      ctx.res.statusCode = 200;
      ctx.res.setHeader('Content-Type', 'application/json');
      ctx.res.end(JSON.stringify(health));
    });

    // Tools list endpoint for Smithery
    this.registerRoute('GET', '/tools/list', async (ctx) => {
      // Return list of available tools without requiring authentication
      const tools = [
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
        }
        // Other tools would be listed here
      ];
      
      ctx.res.statusCode = 200;
      ctx.res.setHeader('Content-Type', 'application/json');
      ctx.res.end(JSON.stringify({ tools }));
    });

    // Add API routes for Kick endpoints
    // This is just an example for one endpoint
    this.registerRoute('GET', '/api/channels/:id', async (ctx) => {
      const channelId = ctx.path.split('/').pop();
      
      if (!channelId) {
        ctx.res.statusCode = 400;
        ctx.res.end(JSON.stringify({ error: 'Channel ID is required' }));
        return;
      }
      
      try {
        const result = await this.kickService.getChannelInfo({ channel_id: channelId });
        ctx.res.statusCode = 200;
        ctx.res.setHeader('Content-Type', 'application/json');
        ctx.res.end(JSON.stringify(result));
      } catch (error) {
        logger.error('Error fetching channel info', error);
        ctx.res.statusCode = 500;
        ctx.res.end(JSON.stringify({ error: 'Failed to fetch channel info' }));
      }
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Initialize response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Powered-By', 'Kick MCP Server');
    
    try {
      // Parse URL and method
      const urlString = `http://${req.headers.host}${req.url || '/'}`;
      const url = new URL(urlString);
      const method = req.method || 'GET';
      const path = url.pathname;
      const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
      
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(ip, path);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.rateLimiter['maxRequests'].toString());
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetTime / 1000).toString());
      
      // Return 429 if rate limited
      if (rateLimitResult.limited) {
        res.statusCode = 429;
        res.end(JSON.stringify({ error: 'Too Many Requests' }));
        return;
      }
      
      // Parse query parameters
      const query: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        query[key] = value;
      });
      
      // Create context object
      const ctx: HttpContext = {
        req,
        res,
        url,
        method,
        path,
        query,
        ip,
        body: null
      };
      
      // Parse JSON body for POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        await this.parseBody(req, ctx);
      }
      
      // Check if route exists
      const routeKey = `${method}:${path}`;
      const wildcardRouteKey = Object.keys(this.routes).find(key => {
        const [routeMethod, routePath] = key.split(':');
        if (routeMethod !== method) return false;
        
        // Check if route uses parameters (e.g., '/api/users/:id')
        if (routePath.includes(':')) {
          const routeParts = routePath.split('/');
          const pathParts = path.split('/');
          
          if (routeParts.length !== pathParts.length) return false;
          
          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) continue;
            if (routeParts[i] !== pathParts[i]) return false;
          }
          
          return true;
        }
        
        return false;
      });
      
      // Find and execute route handler
      const routeHandler = this.routes.get(routeKey) || (wildcardRouteKey ? this.routes.get(wildcardRouteKey) : null);
      
      if (routeHandler) {
        await routeHandler(ctx);
      } else {
        // Route not found
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    } catch (error) {
      // Handle unexpected errors
      logger.error('Server error', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  }
  
  /**
   * Parse request body
   */
  private parseBody(req: http.IncomingMessage, ctx: HttpContext): Promise<void> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      req.on('end', () => {
        if (chunks.length === 0) {
          ctx.body = {};
          resolve();
          return;
        }
        
        const bodyString = Buffer.concat(chunks).toString();
        
        try {
          ctx.body = JSON.parse(bodyString);
          resolve();
        } catch (err) {
          ctx.body = {};
          logger.warn('Failed to parse request body as JSON', { error: err });
          resolve();
        }
      });
      
      req.on('error', (err) => {
        logger.error('Error reading request body', err);
        reject(err);
      });
    });
  }
  
  /**
   * Handle WebSocket connections
   */
  private handleWebSocketConnection(ws: WebSocket, req: http.IncomingMessage): void {
    logger.info('WebSocket connection established');
    
    // Ping/pong for connection keepalive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    // Handle incoming messages
    ws.on('message', async (data: Buffer) => {
      try {
        // Parse message
        const message = JSON.parse(data.toString());
        
        // Process message based on type
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (message.type === 'kick_api') {
          // Example: Handle a Kick API request over WebSocket
          if (!message.method || !message.params) {
            ws.send(JSON.stringify({ 
              id: message.id, 
              error: { message: 'Invalid request format' } 
            }));
            return;
          }
          
          try {
            // Access the corresponding method on kickService
            const method = message.method as keyof KickService;
            
            if (typeof this.kickService[method] === 'function') {
              // @ts-ignore - We've checked that the method exists
              const result = await this.kickService[method](message.params);
              
              // Send result back
              ws.send(JSON.stringify({
                id: message.id,
                result
              }));
            } else {
              ws.send(JSON.stringify({
                id: message.id,
                error: { message: `Method ${message.method} not found` }
              }));
            }
          } catch (error) {
            logger.error(`Error in WebSocket API call: ${message.method}`, error);
            ws.send(JSON.stringify({
              id: message.id,
              error: { 
                message: error instanceof Error ? error.message : 'Unknown error',
                code: error instanceof Error && 'code' in error ? (error as any).code : -32000
              }
            }));
          }
        }
      } catch (err) {
        logger.error('Error processing WebSocket message', err);
      }
    });
    
    // Handle connection close
    ws.on('close', () => {
      clearInterval(pingInterval);
      logger.info('WebSocket connection closed');
    });
    
    // Handle errors
    ws.on('error', (err) => {
      logger.error('WebSocket error', err);
      clearInterval(pingInterval);
    });
    
    // Send initial connection success message
    ws.send(JSON.stringify({ 
      type: 'connection_established',
      timestamp: Date.now()
    }));
  }
  
  /**
   * Stop the server
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close all WebSocket connections
      this.wss.clients.forEach(client => {
        client.terminate();
      });
      
      // Close HTTP server
      this.server.close((err) => {
        if (err) {
          logger.error('Error stopping HTTP server', err);
          reject(err);
        } else {
          logger.info('HTTP server stopped');
          resolve();
        }
      });
    });
  }
} 