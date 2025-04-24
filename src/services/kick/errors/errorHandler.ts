import { KickApiError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { KickErrorCode } from './errorCodes';
import { mapStatusCodeToErrorCode, getErrorMessage } from './errorMapper';

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