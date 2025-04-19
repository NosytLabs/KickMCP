import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from '../utils/errors';

import { defaultRateLimiter } from './rateLimit';


interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    accessToken: string;
  };
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('Missing authorization header');
    
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) throw new Error('Invalid authentication format');

    const user = await req.app.get('authService').verifyToken(token);
    
    req.user = {
      id: user.sub,
      username: user.preferred_username,
      accessToken: token
    };
    next();
  } catch (error) {
    return errorHandler(error, req, res, next);
  }
};

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
  app.use(/^(?!\/(health|api\/(health|kick-health|version|kick\/(oauth-callback|public\/.*))|tools\/list)).*/, authenticate);
  
  // Error handling middleware should be last
  app.use(errorHandler);
};