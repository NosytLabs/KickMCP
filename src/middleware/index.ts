import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from '../utils/errors';
import { validateRequest } from '../utils/validation';
import { defaultRateLimiter } from './rateLimit';
import { authenticate } from './auth';

export const setupMiddleware = (app: Express): void => {
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Performance middleware
  app.use(compression());

  // Custom middleware
  app.use(defaultRateLimiter);
  
  // Skip authentication for health check and tools endpoints
  app.use(/^(?!\/health$)(?!\/tools\/list$)/, authenticate);
  
  // Error handling middleware should be last
  app.use(errorHandler);
}; 