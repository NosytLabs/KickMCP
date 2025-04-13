import { logger } from './logger';

export interface CacheOptions {
  ttl: number;  // Time to live in seconds
  checkPeriod?: number;  // How often to check for expired items (in seconds)
}

export class SimpleCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private checkPeriod: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = { ttl: 60, checkPeriod: 600 }) {
    this.checkPeriod = (options.checkPeriod || 600) * 1000; // Convert to milliseconds
    this.startCleanupTimer();
  }

  /**
   * Set a value in the cache with a TTL
   */
  set(key: string, value: any, ttl?: number): void {
    const expiry = Date.now() + ((ttl || 60) * 1000); // Default to 60 seconds
    this.cache.set(key, { value, expiry });
    logger.debug(`Cache set: ${key}`);
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }
    
    logger.debug(`Cache hit: ${key}`);
    return item.value as T;
  }

  /**
   * Check if a key exists in the cache and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  /**
   * Get the number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Start the cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.checkPeriod);
  }

  /**
   * Remove all expired items from the cache
   */
  private cleanup(): void {
    const now = Date.now();
    let deleted = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      logger.debug(`Cache cleanup: removed ${deleted} expired items`);
    }
  }

  /**
   * Stop the cleanup timer when shutting down
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Export a function to create and configure the cache
export const setupCache = (options: CacheOptions = { ttl: 60, checkPeriod: 600 }): SimpleCache => {
  logger.info('Initializing in-memory cache');
  return new SimpleCache(options);
}; 