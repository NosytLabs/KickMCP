import request from 'supertest';
import { Server } from 'http';
import { WebSocket } from 'ws';
import { app } from '../index';

describe('Kick MCP Server', () => {
  let server: Server;
  let ws: WebSocket;

  beforeAll((done) => {
    server = app.listen(3001, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Health Check', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Public Endpoints', () => {
    it('should allow access to /tools/list without authentication', async () => {
      const response = await request(app).get('/tools/list');
      expect(response.status).toBe(200);
    });

    it('should allow access to /initialize without authentication', async () => {
      const response = await request(app).get('/initialize');
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected endpoints', async () => {
      const response = await request(app).get('/api/channels');
      expect(response.status).toBe(401);
    });

    it('should accept valid authentication', async () => {
      const response = await request(app)
        .get('/api/channels')
        .set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(200);
    });
  });

  describe('WebSocket', () => {
    it('should establish WebSocket connection', (done) => {
      ws = new WebSocket('ws://localhost:3001');
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        done();
      });
    });

    it('should handle ping/pong', (done) => {
      ws.on('pong', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        done();
      });
      ws.ping();
    });

    it('should close connection properly', (done) => {
      ws.on('close', () => {
        expect(ws.readyState).toBe(WebSocket.CLOSED);
        done();
      });
      ws.close();
    });
  });
}); 