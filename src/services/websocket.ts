import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { KickService } from './kick';

export const setupWebSocket = (wss: WebSocketServer, kickService: KickService) => {
  wss.on('connection', (ws: WebSocket) => {
    logger.info('WebSocket client connected');

    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        logger.debug('Received message:', data);

        // Handle different message types
        switch (data.type) {
          case 'PING':
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
            break;

          case 'SUBSCRIBE_CHANNEL':
            if (!data.channelId) {
              ws.send(JSON.stringify({ 
                type: 'ERROR', 
                message: 'Channel ID is required' 
              }));
              break;
            }
            
            try {
              const channelInfo = await kickService.getChannelInfo(data.channelId);
              ws.send(JSON.stringify({ 
                type: 'CHANNEL_INFO', 
                data: channelInfo 
              }));
            } catch (error) {
              if (error instanceof Error) {
                ws.send(JSON.stringify({ 
                  type: 'ERROR', 
                  message: error.message 
                }));
              } else {
                ws.send(JSON.stringify({ 
                  type: 'ERROR', 
                  message: 'Unknown error occurred' 
                }));
              }
            }
            break;

          default:
            ws.send(JSON.stringify({ 
              type: 'ERROR', 
              message: `Unknown message type: ${data.type}` 
            }));
        }
      } catch (error) {
        logger.error('WebSocket error:', error);
        if (error instanceof Error) {
          ws.send(JSON.stringify({ 
            type: 'ERROR', 
            message: `Error processing message: ${error.message}` 
          }));
        } else {
          ws.send(JSON.stringify({ 
            type: 'ERROR', 
            message: 'Unknown error occurred' 
          }));
        }
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket client disconnected');
    });

    ws.on('error', (error: Error) => {
      logger.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'WELCOME', 
      message: 'Connected to Kick MCP WebSocket server' 
    }));
  });

  // Handle ping/pong to keep connections alive
  const pingInterval = Number(process.env.WEBSOCKET_PING_INTERVAL) || 30000;
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, pingInterval);

  return wss;
}; 