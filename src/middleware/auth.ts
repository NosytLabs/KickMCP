import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { KickApiError } from '../utils/errors';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    accessToken: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new KickApiError('No authorization header provided', 'AUTH_ERROR');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new KickApiError('Invalid authorization header format', 'AUTH_ERROR');
    }

    // Here you would typically validate the token against your auth service
    // For now, we'll just attach the token to the request
    req.user = {
      id: 'user-id', // This would come from token validation
      username: 'username', // This would come from token validation
      accessToken: token
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error instanceof KickApiError) {
      return res.status(401).json({
        error: {
          message: error.message,
          type: error.type
        }
      });
    }
    return res.status(401).json({
      error: {
        message: 'Authentication failed',
        type: 'AUTH_ERROR'
      }
    });
  }
}; 