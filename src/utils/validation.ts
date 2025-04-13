import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateConfig = (config: any) => {
  const isSmitheryMode = process.env.SMITHERY_MODE === 'true';
  
  if (!config.kickClientId || !config.kickClientSecret) {
    if (isSmitheryMode) {
      logger.warn('Running in Smithery mode without OAuth credentials. Some features will be limited.');
      return true;
    } else {
      logger.warn('Kick OAuth credentials (client_id and client_secret) are not set. Some features will be limited.');
      return true;
    }
  }
  
  return true;
}; 