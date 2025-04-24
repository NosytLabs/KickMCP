import { logger } from '../../utils/logger';
import { KickApiError } from '../../utils/errors';
import { HttpClient, DEFAULT_TIMEOUT } from '../../utils/http/HttpClient';
import { CacheManager } from '../../utils/cache/CacheManager';

/**
 * BaseKickService class providing common functionality for interacting with the Kick.com API
 */
export abstract class BaseKickService {
  protected abstract basePath: string;
  protected readonly baseUrl: string;
  protected httpClient: HttpClient;
  protected cacheManager: CacheManager;

  constructor(options?: { baseUrl?: string; cacheTtl?: number }) {
    this.baseUrl = options?.baseUrl || process.env.KICK_API_BASE_URL || 'https://api.kick.com/api/v1';
    
    // Initialize HTTP client with base URL
    this.httpClient = new HttpClient({
      baseUrl: this.baseUrl,
      timeout: Number(process.env.API_TIMEOUT) || DEFAULT_TIMEOUT
    });
    
    // Initialize cache manager
    this.cacheManager = new CacheManager({ ttl: options?.cacheTtl || 60 });
    
    logger.debug(`BaseKickService initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Makes an API request with caching and authentication handling
   * @param method HTTP method
   * @param endpoint API endpoint (will be appended to basePath)
   * @param params Request parameters or body
   * @param headers Request headers
   * @param requiresAuth Whether the request requires authentication
   * @param accessToken Access token for authentication (required if requiresAuth is true)
   * @returns Promise with the response data
   */
  protected async makeRequest<T>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
    requiresAuth: boolean = false,
    accessToken?: string,
  ): Promise<T> {
    const fullEndpoint = `${this.basePath}${endpoint}`;
    const fullUrl = `${this.baseUrl}${fullEndpoint}`;
    const requestMethod = method.toUpperCase();
    
    // Check cache for GET requests
    if (this.cacheManager.isCacheable(requestMethod, fullUrl)) {
      const cacheKey = this.cacheManager.generateCacheKey(requestMethod, fullUrl, params);
      const cachedData = this.cacheManager.get<T>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
    }

    // Make the request
    let response: T;
    
    if (requiresAuth) {
      if (!accessToken) {
        logger.error(`Access token required for ${requestMethod} ${fullUrl} but not provided.`);
        throw new KickApiError('Authentication required: Access token missing.', 401);
      }
      response = await this.httpClient.authenticatedRequest<T>(method, fullEndpoint, accessToken, params, headers);
    } else {
      response = await this.httpClient.request<T>(method, fullEndpoint, params, headers);
    }
    
    // Cache the response if applicable
    if (this.cacheManager.isCacheable(requestMethod, fullUrl)) {
      const cacheKey = this.cacheManager.generateCacheKey(requestMethod, fullUrl, params);
      this.cacheManager.set(cacheKey, response);
    }
    
    return response;
  }


}