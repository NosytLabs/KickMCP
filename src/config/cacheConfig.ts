/**
 * Cache configuration settings
 */

// List of endpoints that can be cached
export const CACHEABLE_ENDPOINTS = [
  '/users/me',
  '/channels/\d+', // Match numeric channel IDs
  '/categories',
  '/tags',
  // Add other cachable endpoints as identified
];

// Default cache TTL in seconds
export const DEFAULT_CACHE_TTL = 300; // 5 minutes

// Default cache cleanup period in seconds
export const DEFAULT_CACHE_CLEANUP_PERIOD = 600; // 10 minutes

// Cache configuration interface
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  checkPeriod?: number; // How often to check for expired items (in seconds)
  cacheableEndpoints?: RegExp[]; // Endpoints that can be cached
}

// Default cache configuration
export const defaultCacheConfig: CacheConfig = {
  ttl: DEFAULT_CACHE_TTL,
  checkPeriod: DEFAULT_CACHE_CLEANUP_PERIOD,
  cacheableEndpoints: CACHEABLE_ENDPOINTS.map(pattern => new RegExp(pattern))
};