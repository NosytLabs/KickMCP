import { logger } from './logger';

/**
 * Utility class for handling MCP-related errors consistently
 */
export class MCPErrorHandler {
  /**
   * Format an error message with consistent handling of Error objects
   * @param baseMessage The base error message
   * @param error The error object
   * @param context Optional context information
   * @returns Formatted error message
   */
  public static formatErrorMessage(baseMessage: string, error: unknown, context?: string): string {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const contextInfo = context ? ` [${context}]` : '';
    return `${baseMessage}${contextInfo}: ${errorMessage}`;
  }

  /**
   * Log an error with consistent formatting
   * @param baseMessage The base error message
   * @param error The error object
   * @param context Optional context information
   */
  public static logError(baseMessage: string, error: unknown, context?: string): void {
    const formattedMessage = this.formatErrorMessage(baseMessage, error, context);
    logger.error(formattedMessage);
  }

  /**
   * Create a standardized error result object for diagnostic checks
   * @param name The name of the check
   * @param error The error that occurred
   * @param context Optional context information
   * @returns A standardized error result object
   */
  public static createDiagnosticErrorResult(name: string, error: unknown, context?: string): {
    name: string;
    status: 'fail';
    message: string;
  } {
    return {
      name,
      status: 'fail' as const,
      message: error instanceof Error ? error.message : `Unknown error during ${context || name} check`
    };
  }

  /**
   * Create a standardized error result object for compatibility checks
   * @param name The name of the check
   * @param error The error that occurred
   * @param context Optional context information
   * @returns A standardized error result object
   */
  public static createCompatibilityErrorResult(name: string, error: unknown, context?: string): {
    name: string;
    passed: false;
    message: string;
  } {
    return {
      name,
      passed: false,
      message: error instanceof Error ? error.message : `Unknown error during ${context || name} check`
    };
  }
}