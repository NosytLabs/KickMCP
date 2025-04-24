import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../logger';
import { KickApiError } from '../errors';

// Default request timeout in milliseconds
export const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * HttpClient class for making API requests with consistent error handling and logging
 */
export class HttpClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(options?: {
    baseUrl?: string;
    timeout?: number;
    defaultHeaders?: Record<string, string>;
  }) {
    this.baseUrl = options?.baseUrl || '';
    this.defaultTimeout = options?.timeout || DEFAULT_TIMEOUT;
    this.defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options?.defaultHeaders
    };
  }

  /**
   * Makes an HTTP request to an API endpoint
   * @param method HTTP method
   * @param endpoint API endpoint (will be appended to baseUrl if provided)
   * @param params Request parameters or body
   * @param headers Request headers
   * @param timeout Request timeout in milliseconds
   * @returns Promise with the response data
   */
  public async request<T>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<T> {
    const requestMethod = method.toUpperCase();
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
    
    // Prepare headers
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Prepare Axios config
    const requestConfig: AxiosRequestConfig = {
      method: requestMethod,
      url,
      headers: requestHeaders,
      timeout: timeout || this.defaultTimeout,
    };

    // Add data/params based on method
    if (requestMethod === 'GET' || requestMethod === 'DELETE') {
      requestConfig.params = params;
    } else {
      requestConfig.data = params;
    }

    // Execute request
    const startTime = Date.now();
    logger.debug(`API Request: ${requestMethod} ${url}`, { params: requestMethod !== 'GET' ? params : undefined });

    try {
      const response = await axios(requestConfig);
      const duration = Date.now() - startTime;
      logger.debug(`API Response: ${requestMethod} ${url} (${response.status}) took ${duration}ms`);

      return response.data as T;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logger.error(`API Error (${requestMethod} ${url}) took ${duration}ms:`, error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        let message = error.response?.data?.message || error.message || 'API request failed';

        if (error.code === 'ECONNABORTED') {
          message = `API request timed out after ${timeout || this.defaultTimeout}ms`;
        } else if (error.code === 'ENOTFOUND') {
          message = 'API host not found';
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

  /**
   * Makes an authenticated API request
   * @param method HTTP method
   * @param endpoint API endpoint (will be appended to baseUrl if provided)
   * @param accessToken Access token for authentication
   * @param params Request parameters or body
   * @param headers Request headers
   * @param timeout Request timeout in milliseconds
   * @returns Promise with the response data
   */
  public async authenticatedRequest<T>(
    method: string,
    endpoint: string,
    accessToken: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<T> {
    if (!accessToken) {
      throw new KickApiError('Authentication required: Access token missing.', 401);
    }

    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${accessToken}`
    };

    return this.request<T>(method, endpoint, params, authHeaders, timeout);
  }
}

// Legacy functions for backward compatibility
/**
 * Makes an HTTP request to an API endpoint
 * @deprecated Use HttpClient.request instead
 */
export async function makeApiRequest<T>(
  method: string,
  url: string,
  params?: Record<string, unknown>,
  headers?: Record<string, string>,
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const client = new HttpClient({ timeout });
  return client.request<T>(method, url, params, headers);
}

/**
 * Makes an authenticated API request
 * @deprecated Use HttpClient.authenticatedRequest instead
 */
export async function makeAuthenticatedRequest<T>(
  method: string,
  url: string,
  accessToken: string,
  params?: Record<string, unknown>,
  headers?: Record<string, string>,
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const client = new HttpClient({ timeout });
  return client.authenticatedRequest<T>(method, url, accessToken, params, headers);
}