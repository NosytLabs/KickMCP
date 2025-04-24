import { logger } from './logger';
import { KickService } from '../services/kick';
import { MCPErrorHandler } from './mcpErrorHandler';

/**
 * Utility for running diagnostics on the Model Context Protocol implementation
 */
export class MCPDiagnostics {
  /**
   * Run a comprehensive test of the MCP functionality
   */
  public static async runDiagnostics(): Promise<{
    success: boolean;
    results: Array<{ name: string; status: 'pass' | 'fail'; message: string }>;
  }> {
    logger.info('Starting MCP diagnostics...');
    const results: Array<{ name: string; status: 'pass' | 'fail'; message: string }> = [];
    let overallSuccess = true;

    // Test 1: API Connection
    try {
      logger.info('Testing Kick API connection...');
      const kickService = new KickService();
      const connectionStatus = await kickService.verifyApiConnection();
      
      if (connectionStatus.connected) {
        results.push({
          name: 'API Connection',
          status: 'pass',
          message: connectionStatus.message
        });
      } else {
        overallSuccess = false;
        results.push({
          name: 'API Connection',
          status: 'fail',
          message: connectionStatus.message
        });
      }
    } catch (error) {
      overallSuccess = false;
      results.push(
        MCPErrorHandler.createDiagnosticErrorResult('API Connection', error, 'API connection test')
      );
    }

    // Add more tests here as needed
    // For example: Authentication, WebSocket connection, etc.

    logger.info('MCP diagnostics completed');
    return {
      success: overallSuccess,
      results
    };
  }
}