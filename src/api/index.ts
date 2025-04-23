import { Router } from 'express';
import { errorHandler } from '../utils/errors';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/kick-health', async (req, res) => {
  try {
    const kickService = req.app.get('kickService');
    const status = await kickService.verifyApiConnection();
    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      connected: false, 
      error: error.message || 'Failed to check Kick API health'
    });
  }
});

// MCP version endpoint
router.get('/version', (req, res) => {
  const packageInfo = require('../../package.json');
  res.json({ 
    version: packageInfo.version,
    name: packageInfo.name,
    description: packageInfo.description
  });
});

// Error handling middleware
router.use(errorHandler);

export const setupRoutes = (app: any) => {
  app.use('/api', router);
};