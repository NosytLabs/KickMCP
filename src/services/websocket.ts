import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { KickService } from './kick';

export function setupWebSocket(wss: WebSocketServer, kickService: KickService) {
  wss.on('connection', (ws: WebSocket) => {
    logger.info('Client connected');

    // Setup ping/pong for connection health check
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, Number(process.env.WEBSOCKET_PING_INTERVAL) || 30000);

    ws.on('pong', () => {
      // Connection is alive
    });

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        // Handle incoming messages
        // Implement your message handling logic here
      } catch (error) {
        logger.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      logger.info('Client disconnected');
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      clearInterval(pingInterval);
    });
  });

  // Handle server errors
  wss.on('error', (error) => {
    logger.error('WebSocket server error:', error);
  });
} 