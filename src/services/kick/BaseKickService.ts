import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from '../../utils/logger';
import { KickApiError } from '../../utils/errors';
import { SimpleCache } from '../../utils/cache';

/**
 * Configuration constants for the Kick API service
 */

// List of endpoints that can be cached
const CACHEABLE_ENDPOINTS = [
  '/users/me',
  '/channels/\d+', // Match numeric channel IDs
  '/categories',
  '/tags',
  // Add other cachable endpoints as identified
];

// Default cache TTL in seconds
const DEFAULT_CACHE_TTL = 300; // 5 minutes

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * BaseKickService class providing common functionality for interacting with the Kick.com API
 */
export abstract class BaseKickService {
  protected abstract basePath: string;
  protected readonly baseUrl: string;
  protected cache: SimpleCache;

  constructor(options?: { baseUrl?: string; cacheTtl?: number }) {
    this.baseUrl = options?.baseUrl || process.env.KICK_API_BASE_URL || 'https://api.kick.com/api/v1';
    this.cache = new SimpleCache({ ttl: options?.cacheTtl || DEFAULT_CACHE_TTL });
    logger.debug(`BaseKickService initialized with base URL: ${this.baseUrl}`);
  }

  protected async makeRequest<T>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
    requiresAuth: boolean = false,
    accessToken?: string,
  ): Promise<T> {
    const url = `${this.basePath}${endpoint}`;
    return this._makeRequestCore(method, url, params, headers, requiresAuth, accessToken);
  }

    private async _makeRequestCore<T>(
    method: string,
    url: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
    requiresAuth: boolean = false,
    accessToken?: string,
  ): Promise<T> {
    const fullUrl = url;
    const requestMethod = method.toUpperCase();

    // Cache check for GET requests
    const isCacheable = requestMethod === 'GET' && CACHEABLE_ENDPOINTS.some(path => endpoint.startsWith(path.replace(/\/$/, '')));
    const cacheKey = isCacheable ? `${requestMethod}:${endpoint}:${JSON.stringify(params)}` : '';

    if (cacheKey) {
      const cachedData = this.cache.get<T>(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit for ${endpoint}`);
        return cachedData;
      }
      logger.debug(`Cache miss for ${endpoint}`);
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authorization header if needed
    if (requiresAuth) {
      if (!accessToken) {
        logger.error(`Access token required for ${requestMethod} ${endpoint} but not provided.`);
        throw new KickApiError('Authentication required: Access token missing.', 401);
      }
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    // Prepare Axios config
    const timeout = Number(process.env.API_TIMEOUT) || DEFAULT_TIMEOUT;
    const requestConfig: AxiosRequestConfig = {
      method: requestMethod,
      url: fullUrl,
      headers: requestHeaders,
      timeout,
    };

    // Add data/params based on method
    if (requestMethod === 'GET' || requestMethod === 'DELETE') {
      requestConfig.params = params;
    } else {
      requestConfig.data = params;
    }

    // Execute request
    const startTime = Date.now();
    logger.debug(`API Request: ${requestMethod} ${endpoint}`, { params: requestMethod !== 'GET' ? params : undefined });

    try {
      const response = await axios(requestConfig);
      const duration = Date.now() - startTime;
      logger.debug(`API Response: ${requestMethod} ${endpoint} (${response.status}) took ${duration}ms`);

      const data = response.data as T;

      // Store in cache if applicable
      if (cacheKey && response.status >= 200 && response.status < 300) {
        this.cache.set<T>(cacheKey, data);
        logger.debug(`Cached response for ${endpoint}`);
      }

      return data;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logger.error(`Kick API Error (${requestMethod} ${endpoint}) took ${duration}ms:`, error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        let message = error.response?.data?.message || error.message || 'API request failed';

        if (error.code === 'ECONNABORTED') {
          message = `API request timed out after ${timeout}ms`;
        } else if (error.code === 'ENOTFOUND') {
          message = 'API host not found';
        } else if (status === 401) {
          message = 'Unauthorized: Invalid or expired access token.';
        } else if (status === 403) {
          message = 'Forbidden: Insufficient permissions.';
        } else if (status === 404) {
          message = 'Not Found: The requested resource does not exist.';
        } else if (status === 429) {
          logger.warn(`Rate limit potentially exceeded for ${endpoint}. Check 'Retry-After' header if present.`);
          message = 'Too Many Requests: Rate limit exceeded.';
        }
        // Include more specific error details if available
        if (error.response?.data && typeof error.response.data === 'object') {
             message += ` (Details: ${JSON.stringify(error.response.data)})`;
        }

        throw new KickApiError(message, status, error.response?.data);
      }

      // Handle non-Axios errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown API error occurred';
      throw new KickApiError(errorMessage, 500);
    }
  }


}