import { Router } from 'express';
import { errorHandler } from '../utils/errors';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
router.use(errorHandler);

export const setupRoutes = (app: any) => {
  app.use('/api', router);
}; 