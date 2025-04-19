import { logger } from '../utils/logger';
import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

/**
 * Verifies connection to the Kick API.
 * @returns A promise that resolves to the API status.
 */
export async function verifyKickApiConnection() {
  try {
    // First check if we can resolve the domain
    await lookup('kick.com');
    
    // Try to ping a reliable public API to check internet connectivity
    const response = await axios.get('https://www.cloudflare.com/cdn-cgi/trace', {
      timeout: 5000
    });
    
    return { 
      connected: true, 
      status: 'ok',
      message: 'Network connection is available. Kick API should be accessible.'
    };
  } catch (error) {
    logger.error('Connection check failed:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to verify network connection';
    let errorDetails = '';
    
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOTFOUND') {
        errorMessage = 'Could not resolve Kick hostname. Check your internet connection.';
      } else if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timed out. Network may be slow or unavailable.';
        } else {
          errorMessage = 'Network error occurred while checking connection.';
        }
      }
      
      errorDetails = error.message;
    }
    
    return { 
      connected: false, 
      error: errorDetails,
      message: errorMessage
    };
  }
}