import { logger } from './logger';

export interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum number of requests allowed per window
  keyGenerator?: (ip: string, path: string) => string;  // Function to generate unique keys
}

export class RateLimiter {
  private windows: Map<string, { count: number; timestamp: number }> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (ip: string, path: string) => string;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.keyGenerator = options.keyGenerator || ((ip, path) => `${ip}:${path}`);
    
    // Start cleanup timer to prevent memory leaks
    this.cleanupTimer = setInterval(() => this.cleanup(), this.windowMs * 2);
  }

  /**
   * Check if a request should be rate limited
   * @param ip Client IP address
   * @param path Request path
   * @returns Object containing limit info
   */
  check(ip: string, path: string): { limited: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = this.keyGenerator(ip, path);
    let windowData = this.windows.get(key);
    if (!windowData || now - windowData.timestamp > this.windowMs) {
      windowData = { count: 0, timestamp: now };
    }
    windowData.count++;
    this.windows.set(key, windowData);
    const limited = windowData.count > this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - windowData.count);
    const resetTime = windowData.timestamp + this.windowMs;
    if (limited) {
      logger.warn(`Rate limit exceeded for ${key} (${windowData.count}/${this.maxRequests})`);
    }
    return { limited, remaining, resetTime };
  }

  /**
   * Remove expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    let deleted = 0;
    for (const [key, data] of this.windows.entries()) {
      if (now - data.timestamp > this.windowMs) {
        this.windows.delete(key);
        deleted++;
      }
    }
    if (deleted > 0) {
      logger.info(`Rate limiter cleanup: removed ${deleted} expired windows`);
    }
  }

  /**
   * Stop the cleanup timer
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.info('Rate limiter cleanup timer stopped');
    }
  }
}

/**
 * Create a configured rate limiter instance
 */
export const createRateLimiter = (options: RateLimitOptions): RateLimiter => {
  logger.info(`Creating rate limiter: ${options.maxRequests} requests per ${options.windowMs}ms`);
  return new RateLimiter(options);
};