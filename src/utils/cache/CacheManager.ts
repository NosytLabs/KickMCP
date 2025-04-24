import { logger } from '../logger';

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  checkPeriod?: number; // How often to check for expired items (in seconds)
  cacheablePatterns?: RegExp[]; // URL patterns that can be cached
}

interface CacheEntry<T = unknown> {
  value: T;
  expiry: number;
}

/**
 * Unified cache manager for handling API response caching
 * Replaces both SimpleCache and CacheService with a single, more robust implementation
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private ttl: number;
  private checkPeriod: number;
  private cacheablePatterns: RegExp[];

  constructor(options: CacheOptions = { ttl: 60 }) {
    this.ttl = options.ttl;
    this.checkPeriod = (options.checkPeriod ?? 600) * 1000;
    this.cacheablePatterns = options.cacheablePatterns ?? [/.*/]; // Default to cache everything
    
    this.startCleanupTimer();
    logger.debug(`CacheManager initialized with TTL: ${this.ttl}s`);
  }

  /**
   * Sets a value in the cache
   */
  public set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + ((ttl ?? this.ttl) * 1000);
    this.cache.set(key, { value, expiry });
    logger.debug(`Cache set: ${key}`);
  }

  /**
   * Gets a value from the cache
   */
  public get<T>(key: string): T | null {
    const item = this.getItem<T>(key);
    if (item) {
      logger.debug(`Cache hit: ${key}`);
      return item.value;
    }
    logger.debug(`Cache miss: ${key}`);
    return null;
  }

  /**
   * Checks if a key exists in the cache
   */
  public has(key: string): boolean {
    return !!this.getItem<unknown>(key);
  }

  /**
   * Deletes a key from the cache
   */
  public delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) logger.debug(`Cache deleted: ${key}`);
    return existed;
  }

  /**
   * Clears the entire cache
   */
  public clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Gets the number of items in the cache
   */
  public get size(): number {
    return this.cache.size;
  }

  /**
   * Determines if a request should be cached based on method and URL
   */
  public isCacheable(method: string, url: string): boolean {
    if (method.toUpperCase() !== 'GET') return false;
    
    return this.cacheablePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Generates a cache key for a request
   */
  public generateCacheKey(method: string, url: string, params?: Record<string, unknown>): string {
    return `${method.toUpperCase()}:${url}:${JSON.stringify(params || {})}`;
  }

  /**
   * Invalidates cache entries that match a pattern
   */
  public invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.getKeys()) {
      if (pattern.test(key)) {
        this.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.info(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
    }
    return count;
  }

  /**
   * Gets all cache keys
   */
  public getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Shuts down the cache manager
   */
  public shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.info('Cache cleanup timer stopped');
    }
  }

  /**
   * Gets a cache entry without removing it if expired
   */
  private getItem<T>(key: string): CacheEntry<T> | null {
    const item = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!item || Date.now() > item.expiry) {
      if (item) this.cache.delete(key);
      return null;
    }
    return item;
  }

  /**
   * Starts the cleanup timer
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
   * Cleans up expired cache entries
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
      logger.info(`Cache cleanup: removed ${deleted} expired items`);
    }
  }
}

// Create a singleton instance for global use
let globalCacheManager: CacheManager | null = null;

/**
 * Gets or creates the global cache manager instance
 */
export function getGlobalCacheManager(options?: CacheOptions): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager(options);
    logger.info('Global cache manager initialized');
  }
  return globalCacheManager;
}