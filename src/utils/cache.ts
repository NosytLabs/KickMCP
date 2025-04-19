import { logger } from './logger';

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  checkPeriod?: number; // How often to check for expired items (in seconds)
}

interface CacheEntry<T = unknown> {
  value: T;
  expiry: number;
}

export class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private checkPeriod: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = { ttl: 60, checkPeriod: 600 }) {
    this.checkPeriod = (options.checkPeriod ?? 600) * 1000;
    this.startCleanupTimer();
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + ((ttl ?? 60) * 1000);
    this.cache.set(key, { value, expiry });
    logger.debug(`Cache set: ${key}`);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }
    logger.debug(`Cache hit: ${key}`);
    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) logger.debug(`Cache deleted: ${key}`);
    return existed;
  }

  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  get size(): number {
    return this.cache.size;
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.checkPeriod);
  }

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
      logger.info(`Cache cleanup: removed ${deleted} expired items`);
    }
  }

  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.info('Cache cleanup timer stopped');
    }
  }
}

export const setupCache = (options: CacheOptions = { ttl: 60, checkPeriod: 600 }): SimpleCache => {
  logger.info('Initializing in-memory cache');
  return new SimpleCache(options);
};