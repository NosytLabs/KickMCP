import { SimpleCache, CacheOptions } from '../../utils/cache';
import { logger } from '../../utils/logger';
import { defaultCacheConfig, CacheConfig } from '../../config/cacheConfig';

/**
 * Service responsible for caching API responses
 */
export class CacheService {
  private cache: SimpleCache;
  private config: CacheConfig;

  constructor(options?: Partial<CacheConfig>) {
    this.config = { ...defaultCacheConfig, ...options };
    this.cache = new SimpleCache({
      ttl: this.config.ttl,
      checkPeriod: this.config.checkPeriod
    });
    logger.debug(`CacheService initialized with TTL: ${this.config.ttl}s`);
  }

  /**
   * Determines if a request should be cached based on method and URL
   */
  public isCacheable(method: string, url: string): boolean {
    if (method.toUpperCase() !== 'GET') return false;
    
    return this.config.cacheableEndpoints?.some(pattern => 
      pattern.test(url)
    ) || false;
  }

  /**
   * Generates a cache key for a request
   */
  public generateCacheKey(method: string, url: string, params?: Record<string, unknown>): string {
    return `${method.toUpperCase()}:${url}:${JSON.stringify(params || {})}`;
  }

  /**
   * Gets a value from the cache
   */
  public get<T>(key: string): T | null {
    const cachedData = this.cache.get<T>(key);
    if (cachedData) {
      logger.debug(`Cache hit for ${key}`);
      return cachedData;
    }
    logger.debug(`Cache miss for ${key}`);
    return null;
  }

  /**
   * Sets a value in the cache
   */
  public set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set<T>(key, value, ttl);
    logger.debug(`Cached response for ${key}`);
  }

  /**
   * Clears the entire cache
   */
  public clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Invalidates cache entries that match a pattern
   */
  public invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.getKeys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
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
  private getKeys(): string[] {
    // This is a workaround since SimpleCache doesn't expose keys directly
    // In a real implementation, we would modify SimpleCache to expose keys
    return Array.from((this.cache as any).cache.keys());
  }

  /**
   * Shuts down the cache service
   */
  public shutdown(): void {
    this.cache.shutdown();
  }
}