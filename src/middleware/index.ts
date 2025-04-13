import { Express } from 'express';
import { errorHandler } from '../utils/errors';
import { validateRequest } from '../utils/validation';
import { rateLimit } from './rateLimit';
import { authenticate } from './auth';

export const setupMiddleware = (app: Express) => {
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Performance middleware
  app.use(compression());

  // Custom middleware
  app.use(rateLimit);
  app.use(authenticate);
  app.use(validateRequest);

  // Error handling
  app.use(errorHandler);
}; 