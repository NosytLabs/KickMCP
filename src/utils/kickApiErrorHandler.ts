import { KickApiError } from './errors';
import { logger } from './logger';

/**
 * Error codes specific to the Kick API
 */
export enum KickErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'invalid_credentials',
  EXPIRED_TOKEN = 'expired_token',
  INVALID_TOKEN = 'invalid_token',
  INSUFFICIENT_SCOPE = 'insufficient_scope',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_ALREADY_EXISTS = 'resource_already_exists',
  RESOURCE_FORBIDDEN = 'resource_forbidden',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  
  // Webhook errors
  WEBHOOK_INVALID_URL = 'webhook_invalid_url',
  WEBHOOK_INVALID_SIGNATURE = 'webhook_invalid_signature',
  WEBHOOK_INVALID_EVENT = 'webhook_invalid_event',
  
  // Stream errors
  STREAM_ALREADY_ACTIVE = 'stream_already_active',
  STREAM_NOT_ACTIVE = 'stream_not_active',
  
  // General errors
  BAD_REQUEST = 'bad_request',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  SERVICE_UNAVAILABLE = 'service_unavailable'
}

/**
 * Maps HTTP status codes to specific Kick API error codes
 * @param statusCode The HTTP status code
 * @param responseData Additional response data that might contain error details
 * @returns The appropriate Kick error code
 */
export function mapStatusCodeToErrorCode(statusCode: number, responseData?: any): KickErrorCode {
  // Extract any error code that might be in the response data
  const responseErrorCode = responseData?.error?.code;
  if (responseErrorCode) {
    // If the API returns a specific error code, use it if it matches our enum
    const matchedCode = Object.values(KickErrorCode).find(
      code => code === responseErrorCode
    );
    if (matchedCode) return matchedCode as KickErrorCode;
  }
  
  // Otherwise map based on status code
  switch (statusCode) {
    case 400:
      return KickErrorCode.BAD_REQUEST;
    case 401:
      return KickErrorCode.INVALID_TOKEN;
    case 403:
      return KickErrorCode.RESOURCE_FORBIDDEN;
    case 404:
      return KickErrorCode.RESOURCE_NOT_FOUND;
    case 409:
      // Check response data for more specific conflict type
      if (responseData?.error?.message?.includes('stream')) {
        return KickErrorCode.STREAM_ALREADY_ACTIVE;
      }
      return KickErrorCode.RESOURCE_ALREADY_EXISTS;
    case 429:
      return KickErrorCode.RATE_LIMIT_EXCEEDED;
    case 500:
      return KickErrorCode.INTERNAL_SERVER_ERROR;
    case 503:
      return KickErrorCode.SERVICE_UNAVAILABLE;
    default:
      return KickErrorCode.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Gets a user-friendly error message based on the error code
 * @param errorCode The Kick API error code
 * @param context Additional context about the error
 * @returns A user-friendly error message
 */
export function getErrorMessage(errorCode: KickErrorCode, context?: string): string {
  const contextStr = context ? ` (${context})` : '';
  
  switch (errorCode) {
    // Authentication errors
    case KickErrorCode.INVALID_CREDENTIALS:
      return `Invalid client credentials${contextStr}. Please check your client ID and secret.`;
    case KickErrorCode.EXPIRED_TOKEN:
      return `Access token has expired${contextStr}. Please refresh your token.`;
    case KickErrorCode.INVALID_TOKEN:
      return `Invalid or malformed access token${contextStr}. Please authenticate again.`;
    case KickErrorCode.INSUFFICIENT_SCOPE:
      return `Insufficient permissions${contextStr}. The token does not have the required scopes.`;
    
    // Resource errors
    case KickErrorCode.RESOURCE_NOT_FOUND:
      return `The requested resource was not found${contextStr}.`;
    case KickErrorCode.RESOURCE_ALREADY_EXISTS:
      return `The resource already exists${contextStr}.`;
    case KickErrorCode.RESOURCE_FORBIDDEN:
      return `You do not have permission to access this resource${contextStr}.`;
    
    // Rate limiting
    case KickErrorCode.RATE_LIMIT_EXCEEDED:
      return `Rate limit exceeded${contextStr}. Please try again later.`;
    
    // Webhook errors
    case KickErrorCode.WEBHOOK_INVALID_URL:
      return `Invalid webhook URL${contextStr}. Please provide a valid, publicly accessible URL.`;
    case KickErrorCode.WEBHOOK_INVALID_SIGNATURE:
      return `Invalid webhook signature${contextStr}. The request could not be verified.`;
    case KickErrorCode.WEBHOOK_INVALID_EVENT:
      return `Invalid webhook event type${contextStr}. Please check the supported event types.`;
    
    // Stream errors
    case KickErrorCode.STREAM_ALREADY_ACTIVE:
      return `Stream is already active${contextStr}.`;
    case KickErrorCode.STREAM_NOT_ACTIVE:
      return `No active stream found${contextStr}.`;
    
    // General errors
    case KickErrorCode.BAD_REQUEST:
      return `Invalid request parameters${contextStr}. Please check your input.`;
    case KickErrorCode.INTERNAL_SERVER_ERROR:
      return `An internal server error occurred${contextStr}. Please try again later.`;
    case KickErrorCode.SERVICE_UNAVAILABLE:
      return `The service is currently unavailable${contextStr}. Please try again later.`;
    
    default:
      return `An unknown error occurred${contextStr}.`;
  }
}

/**
 * Creates a KickApiError with the appropriate error code and message
 * @param statusCode HTTP status code
 * @param responseData Additional response data
 * @param context Additional context about the error
 * @returns A KickApiError with detailed information
 */
export function createKickApiError(statusCode: number, responseData?: any, context?: string): KickApiError {
  const errorCode = mapStatusCodeToErrorCode(statusCode, responseData);
  const errorMessage = getErrorMessage(errorCode, context);
  
  // Log the error with detailed information
  logger.error(`Kick API Error: ${errorMessage}`, {
    statusCode,
    errorCode,
    context,
    responseData
  });
  
  return new KickApiError(errorMessage, statusCode, responseData);
}

/**
 * Handles common API errors with appropriate responses
 * @param error The caught error
 * @param context Additional context about the error
 * @throws A KickApiError with detailed information
 */
export function handleApiError(error: any, context?: string): never {
  if (error instanceof KickApiError) {
    // If it's already a KickApiError, just add more context if provided
    if (context && !error.message.includes(context)) {
      error.message = `${error.message} (${context})`;
    }
    throw error;
  }
  
  // For Axios errors, create a proper KickApiError
  if (error.isAxiosError) {
    const statusCode = error.response?.status || 500;
    throw createKickApiError(statusCode, error.response?.data, context);
  }
  
  // For other errors, wrap in a generic KickApiError
  const errorMessage = error.message || 'Unknown error';
  logger.error(`Unexpected error: ${errorMessage}`, { context, error });
  throw new KickApiError(`${errorMessage} (${context || 'unknown context'})`, 500);
}