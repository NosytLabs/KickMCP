import { Request, Response, NextFunction } from 'express';
import expressRateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export const createRateLimiter = (config: RateLimitConfig) => {
  const limiter = expressRateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message || 'Too many requests, please try again later.',
    standardHeaders: config.standardHeaders ?? true,
    legacyHeaders: config.legacyHeaders ?? false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: {
          message: 'Rate limit exceeded',
          status: 429,
          retryAfter: res.getHeader('Retry-After')
        }
      });
    }
  });

  return limiter;
};

// Default rate limiter configuration
export const defaultRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 1 minute'
});

// Export default rate limiter for use in middleware
export const rateLimit = defaultRateLimiter; 