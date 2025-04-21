import { PersistentStore } from '../../utils/persistentStore';
import { logger } from '../../utils/logger';
import { BaseKickService } from './BaseKickService'; // Removed KickServiceOptions import
import path from 'path';

// Define the structure for the data stored persistently
interface AuthData {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number; // Optional: Store expiry time for proactive refresh
  userId?: string; // Optional: Store associated user ID
  [key: string]: string | number | undefined; // Add index signature
}

// Define the path for the persistent store file
// Using a subdirectory like 'data' is good practice
const STORE_FILE_PATH = path.resolve(process.cwd(), 'data', 'auth-store.enc');

export class AuthService extends BaseKickService {
  // Implement the abstract property from BaseKickService
  protected basePath = '/auth'; // Assuming '/auth' is the base path for auth endpoints

  private tokenStore: PersistentStore<AuthData>;
  private isStoreInitialized = false;

  // Use the inline type for options as defined in BaseKickService
  constructor(options?: { baseUrl?: string; cacheTtl?: number }) {
    super(options); // Pass options to base service if needed

    // Retrieve the encryption key from environment variables
    const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;

    if (!encryptionKey) {
      logger.error('CRITICAL: TOKEN_ENCRYPTION_KEY environment variable is not set.');
      logger.warn('Token persistence will use an insecure default key. THIS IS NOT SAFE FOR PRODUCTION.');
      // Consider throwing an error in production environments here to prevent startup
    } else if (encryptionKey.length !== 64) {
        logger.error('CRITICAL: TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
        logger.warn('Token persistence will use an insecure default key due to invalid key format.');
        // Consider throwing an error here as well
    }

    this.tokenStore = new PersistentStore<AuthData>({
      filePath: STORE_FILE_PATH,
      // Provide the key, PersistentStore handles the default/warning if invalid
      encryptionKey: encryptionKey || '',
    });
  }

  /**
   * Initializes the persistent token store. Must be called before using token methods.
   */
  async initialize(): Promise<void> {
    if (this.isStoreInitialized) {
      return;
    }
    try {
      await this.tokenStore.initialize();
      this.isStoreInitialized = true;
      logger.info('AuthService token store initialized successfully.');
      // Perform initial validation/check after loading
      await this.validateStoredToken();
    } catch (error) {
      logger.error('Failed to initialize AuthService token store.', error);
      // Depending on severity, might re-throw or prevent service readiness
      throw error;
    }
  }

  private ensureStoreInitialized(): void {
    if (!this.isStoreInitialized) {
      throw new Error('AuthService token store is not initialized. Call initialize() first.');
    }
  }

  /**
   * Placeholder for validating the token on startup (e.g., check expiry, ping API)
   */
  private async validateStoredToken(): Promise<void> {
    this.ensureStoreInitialized();
    const token = this.tokenStore.get('accessToken');
    const expiry = this.tokenStore.get('tokenExpiry');

    if (token) {
        if (expiry && Date.now() >= expiry) {
            logger.warn('Stored access token has expired. Attempting refresh or requiring re-login.');
            // TODO: Implement token refresh logic here if applicable
            await this.clearTokens(); // Clear expired token for now
        } else {
            logger.info('Found valid stored access token.');
            // TODO: Optionally ping a protected API endpoint to fully verify the token
        }
    } else {
        logger.info('No stored access token found.');
    }
  }


  // --- Placeholder Methods for Authentication Flow ---

  /**
   * Simulates storing tokens after a successful login.
   * Replace with actual API call and token extraction.
   */
  async login(userId: string, accessToken: string, refreshToken: string, expiresInSeconds: number): Promise<void> {
    this.ensureStoreInitialized();
    const expiry = Date.now() + expiresInSeconds * 1000;
    await this.tokenStore.set('userId', userId);
    await this.tokenStore.set('accessToken', accessToken);
    await this.tokenStore.set('refreshToken', refreshToken);
    await this.tokenStore.set('tokenExpiry', expiry); // Save calculated expiry
    logger.info(`Tokens stored successfully for user ${userId}.`);
  }

  /**
   * Retrieves the current access token.
   */
  getAccessToken(): string | undefined {
    this.ensureStoreInitialized();
    // TODO: Add logic here to check expiry and potentially trigger refresh
    const expiry = this.tokenStore.get('tokenExpiry');
    if (expiry && Date.now() >= expiry) {
        logger.warn('Access token expired. Need refresh or re-login.');
        // In a real scenario, you'd trigger refresh flow here
        return undefined;
    }
    return this.tokenStore.get('accessToken');
  }

  /**
   * Retrieves the current refresh token.
   */
  getRefreshToken(): string | undefined {
    this.ensureStoreInitialized();
    return this.tokenStore.get('refreshToken');
  }

  /**
   * Clears stored tokens (e.g., on logout or invalidation).
   */
  async clearTokens(): Promise<void> {
    this.ensureStoreInitialized();
    // Use clear which saves automatically, or delete individual keys
    await this.tokenStore.clear();
    logger.info('Stored authentication tokens cleared.');
  }

  // TODO: Add methods for actual Kick API authentication (e.g., OAuth flow, token refresh)
}