import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { KickApiError } from '../types/api';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  if (err instanceof KickApiError) {
    return res.status(400).json({
      error: {
        message: err.message,
        type: 'API_ERROR'
      }
    });
  }

  return res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'INTERNAL_ERROR'
    }
  });
}; 