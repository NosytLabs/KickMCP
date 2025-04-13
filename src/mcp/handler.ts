import { JSONRPCServer, JSONRPCRequest, JSONRPCResponse } from 'json-rpc-2.0';
import * as readline from 'readline';
import { logger } from '../utils/logger';
import { KickService } from '../services/kick';

// Define tool schemas
const toolSchemas = [
  {
    name: 'getChannelInfo',
    description: 'Get channel information',
    inputSchema: {
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
  {
    name: 'getLivestreams',
    description: 'Get list of current livestreams',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getLivestreamBySlug',
    description: 'Get livestream by slug',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Stream slug'
        }
      },
      required: ['slug']
    }
  }
  // Additional tool definitions can be added here
];

/**
 * Setup and handle JSON-RPC over stdin/stdout for MCP
 */
export const setupMCPHandler = (kickService: KickService): void => {
  // Create JSON-RPC server
  const jsonRpcServer = new JSONRPCServer();

  // Register standard MCP methods
  
  // Initialize method - required by MCP protocol
  jsonRpcServer.addMethod('initialize', async () => {
    logger.info('MCP initialize request received');
    return {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'Kick MCP Server',
        version: process.env.npm_package_version || '1.0.0',
        vendor: 'NosytLabs'
      },
      capabilities: {
        authentication: {
          type: 'oauth2'
        },
        completion: false,
        embeddings: false,
        tools: {
          // Add tool-specific capabilities if needed
          enabled: true,
          toolExecutionMode: 'synchronous',
          toolExecutionApiVersion: '1.0'
        }
      }
    };
  });
  
  // List tools method - required by MCP protocol
  jsonRpcServer.addMethod('tools/list', async () => {
    logger.info('MCP tools/list request received');
    return { tools: toolSchemas };
  });

  // Register API methods
  jsonRpcServer.addMethod('getChannelInfo', async (params: any) => {
    return kickService.getChannelInfo(params.channelId);
  });

  jsonRpcServer.addMethod('getLivestreams', async () => {
    return kickService.getLivestreams();
  });

  jsonRpcServer.addMethod('getLivestreamBySlug', async (params: any) => {
    return kickService.getLivestreamBySlug(params.slug);
  });

  // Create readline interface for stdin
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
  });

  // Process JSON-RPC requests from stdin
  rl.on('line', async (line) => {
    try {
      // Parse the JSON-RPC request
      const jsonRpcRequest: JSONRPCRequest = JSON.parse(line);
      logger.debug('Received JSON-RPC request', { request: jsonRpcRequest });

      // Handle the request
      const response = await jsonRpcServer.receive(jsonRpcRequest);
      
      // Send response to stdout if not null
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (error) {
      logger.error('Error handling JSON-RPC request', error);
      
      // Send error response to stdout
      const errorResponse: JSONRPCResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  });

  // Handle input stream ending
  rl.on('close', () => {
    logger.info('stdin stream closed, exiting');
    process.exit(0);
  });

  logger.info('MCP JSON-RPC handler initialized');
}; 