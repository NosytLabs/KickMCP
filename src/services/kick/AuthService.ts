import { BaseKickService } from './BaseKickService';
import * as KickTypes from '../../types/kick';
import { logger } from '../../utils/logger';
import { PersistentStore } from '../../utils/persistentStore';
import path from 'path';
import { KickApiError } from '../../utils/errors';

/**
 * Service for handling Kick API Authentication methods.
 */

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
  /**
   * Gets an App Access Token for application-level API access.
   * @param params Request parameters including client_id, client_secret, and grant_type.
   * @returns The App Access Token response.
   */
  async getAppAccessToken(params: {
    client_id: string;
    client_secret: string;
    grant_type: string;
  }): Promise<KickTypes.AppAccessTokenResponse> {
    const endpoint = '/oauth/token';
    logger.debug('Requesting App Access Token');
    return this.makeRequest<KickTypes.AppAccessTokenResponse>('POST', endpoint, params, {}, false);
  }
gith
  /**
   * Generates OAuth URL for PKCE flow
   */
  async getOAuthUrl(params: {
    client_id: string;
    redirect_uri: string;
    scope: string;
    state: string;
    code_challenge: string;
    code_challenge_method: string;
  }): Promise<{ url: string }> {
    const queryParams = new URLSearchParams({
      response_type: 'code',
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      scope: params.scope,
      state: params.state,
      code_challenge: params.code_challenge,
      code_challenge_method: params.code_challenge_method
    });
    
    return {
      url: `https://kick.com/oauth/authorize?${queryParams.toString()}`
    };
  }

  /**
   * Exchanges authorization code for access token
   */
  async getAccessToken(params: {
    client_id: string;
    client_secret: string;
    code: string;
    redirect_uri: string;
    code_verifier: string;
  }): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
    const endpoint = '/oauth/token';
    const requestBody = {
      grant_type: 'authorization_code',
      client_id: params.client_id,
      client_secret: params.client_secret,
      code: params.code,
      redirect_uri: params.redirect_uri,
      code_verifier: params.code_verifier
    };
    
    return this.makeRequest('POST', endpoint, requestBody, {}, false);
  }

  /**
   * Refreshes an expired access token using a refresh token
   */
  async refreshAccessToken(params: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
  }): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
    const endpoint = '/oauth/token';
    const requestBody = {
      grant_type: 'refresh_token',
      client_id: params.client_id,
      client_secret: params.client_secret,
      refresh_token: params.refresh_token
    };
    
    return this.makeRequest('POST', endpoint, requestBody, {}, false);
  }

  /**
   * Validates an access token
   */
  async validateToken(params: { access_token: string }): Promise<{ valid: boolean; expires_in?: number }> {
    const endpoint = '/oauth/validate';
    return this.makeRequest('POST', endpoint, { token: params.access_token }, {}, false);
  }

  /**
   * Revokes an access token
   */
  async revokeToken(params: { access_token: string }): Promise<{ success: boolean }> {
    const endpoint = '/oauth/revoke';
    return this.makeRequest('POST', endpoint, { token: params.access_token }, {}, false);
  }
  // Implement the abstract property from BaseKickService
  protected basePath = '/auth'; // Assuming '/auth' is the base path for auth endpoints

  private tokenStore: PersistentStore<AuthData>;
  private isStoreInitialized = false;

  // Use the inline type for options as defined in BaseKickService
  constructor(options?: { baseUrl?: string; cacheTtl?: number }) {
    super(options); // Pass options to base service if needed

    this.tokenStore = new PersistentStore<AuthData>({
      filePath: STORE_FILE_PATH
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
   * Validates the stored token on startup and attempts to refresh if expired.
   * Also performs a validation check against the API to ensure the token is valid.
   */
  private async validateStoredToken(): Promise<void> {
    this.ensureStoreInitialized();
    const token = this.tokenStore.get('accessToken');
    const refreshToken = this.tokenStore.get('refreshToken');
    const expiry = this.tokenStore.get('tokenExpiry');
    const userId = this.tokenStore.get('userId');

    if (!token) {
      logger.info('No stored access token found.');
      return;
    }

    // Check if token is expired
    if (expiry && Date.now() >= expiry) {
      logger.warn('Stored access token has expired. Attempting refresh.');
      
      // If we have a refresh token, try to refresh
      if (refreshToken && userId) {
        try {
          // Get client credentials from environment
          const clientId = process.env.KICK_CLIENT_ID;
          const clientSecret = process.env.KICK_CLIENT_SECRET;
          
          if (!clientId || !clientSecret) {
            logger.error('Missing client credentials for token refresh');
            await this.clearTokens();
            return;
          }
          
          // Attempt to refresh the token
          const refreshResult = await this.refreshAccessToken({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken
          });
          
          // Store the new tokens
          await this.login(
            userId,
            refreshResult.access_token,
            refreshResult.refresh_token,
            refreshResult.expires_in
          );
          
          logger.info('Successfully refreshed access token on startup');
        } catch (error) {
          logger.error('Failed to refresh token on startup', error);
          await this.clearTokens();
          return;
        }
      } else {
        logger.warn('Cannot refresh token: missing refresh token or user ID');
        await this.clearTokens();
        return;
      }
    } else {
      logger.info('Found valid stored access token.');
    }
    
    // Verify token with API by making a test request
    try {
      // Create a temporary instance of UserService to avoid circular dependencies
      const { UserService } = require('./UserService');
      const userService = new UserService();
      
      // Make a lightweight API call to verify token
      await userService.getUserProfile({ access_token: token });
      logger.info('Access token verified with API');
    } catch (error) {
      logger.error('Token validation failed against API', error);
      
      // If it's an auth error, clear the tokens
      if (error instanceof KickApiError && 
          (error.statusCode === 401 || error.statusCode === 403)) {
        logger.warn('Clearing invalid tokens after API validation failure');
        await this.clearTokens();
      }
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
   * Retrieves the current access token from storage.
   * Automatically refreshes the token if it's expired or about to expire.
   * @param options Optional parameters for token retrieval
   * @returns The current access token or undefined if not available
   */
  async getStoredAccessToken(options?: { forceRefresh?: boolean }): Promise<string | undefined> {
    this.ensureStoreInitialized();
    
    const accessToken = this.tokenStore.get('accessToken');
    const refreshToken = this.tokenStore.get('refreshToken');
    const expiry = this.tokenStore.get('tokenExpiry');
    const userId = this.tokenStore.get('userId');
    
    // If we don't have tokens, we can't do anything
    if (!accessToken || !refreshToken || !userId) {
      logger.warn('Missing tokens or user ID. User needs to log in.');
      return undefined;
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const isExpired = expiry && Date.now() >= expiry;
    const isExpiringSoon = expiry && Date.now() >= (expiry - 5 * 60 * 1000); // 5 minutes before expiry
    
    // Refresh if forced, expired, or expiring soon
    if (options?.forceRefresh || isExpired || isExpiringSoon) {
      try {
        logger.info(`Access token ${isExpired ? 'expired' : 'expiring soon'}. Attempting refresh.`);
        
        // Get client credentials from environment or config
        const clientId = process.env.KICK_CLIENT_ID;
        const clientSecret = process.env.KICK_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          logger.error('Missing client credentials for token refresh');
          return undefined;
        }
        
        // Attempt to refresh the token
        const refreshResult = await this.refreshAccessToken({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken
        });
        
        // Store the new tokens
        await this.login(
          userId,
          refreshResult.access_token,
          refreshResult.refresh_token,
          refreshResult.expires_in
        );
        
        logger.info('Successfully refreshed access token');
        return refreshResult.access_token;
      } catch (error) {
        logger.error('Failed to refresh access token', error);
        // Clear tokens if refresh fails with an auth error
        if (error instanceof KickApiError && (error.statusCode === 401 || error.statusCode === 400)) {
          logger.warn('Clearing invalid tokens after failed refresh');
          await this.clearTokens();
        }
        return undefined;
      }
    }
    
    return accessToken;
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

  /**
   * Generates an OAuth authorization URL.
   * Does not require authentication itself, but initiates the flow.
   * @param params The OAuth parameters.
   * @returns An object containing the authorization URL.
   */
  async getOAuthUrl(params: {
    client_id: string;
    redirect_uri: string;
    scope: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
  }): Promise<{ url: string }> {
    // This method constructs a URL and doesn't directly call makeRequest
    const url = new URL(`${this.baseUrl}/oauth2/authorize`);
    url.searchParams.append('response_type', 'code'); // Standard OAuth param
    url.searchParams.append('client_id', params.client_id);
    url.searchParams.append('redirect_uri', params.redirect_uri);
    url.searchParams.append('scope', params.scope);
    if (params.state) url.searchParams.append('state', params.state);
    if (params.code_challenge) url.searchParams.append('code_challenge', params.code_challenge);
    if (params.code_challenge_method) url.searchParams.append('code_challenge_method', params.code_challenge_method);

    logger.debug('Generated OAuth URL', { url: url.toString() });
    return Promise.resolve({ url: url.toString() }); // Return Promise for consistency
  }

  /**
   * Exchanges an authorization code for an access token.
   * @param params The token request parameters.
   * @returns The token response.
   */
  async getAccessToken(params: {
    client_id: string;
    client_secret: string;
    code: string;
    redirect_uri: string;
    code_verifier?: string;
  }): Promise<KickTypes.TokenResponse> {
    const endpoint = '/oauth2/token';
    const body = {
      grant_type: 'authorization_code',
      client_id: params.client_id,
      client_secret: params.client_secret,
      code: params.code,
      redirect_uri: params.redirect_uri,
      code_verifier: params.code_verifier,
    };
    logger.info(`Requesting access token for client_id: ${params.client_id}`);
    // Auth service methods typically don't require bearer token themselves
    return this.makeRequest<KickTypes.TokenResponse>('POST', endpoint, body, {}, false);
  }

  /**
   * Refreshes an access token using a refresh token.
   * Handles specific error cases with detailed error messages.
   * @param params The refresh token request parameters.
   * @returns The token response.
   */
  async refreshAccessToken(params: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
  }): Promise<KickTypes.TokenResponse> {
    const endpoint = '/oauth2/token';
    const body = {
      grant_type: 'refresh_token',
      client_id: params.client_id,
      client_secret: params.client_secret,
      refresh_token: params.refresh_token,
    };
    logger.info(`Refreshing access token for client_id: ${params.client_id}`);
    return this.makeRequest<KickTypes.TokenResponse>('POST', endpoint, body, {}, false);
  }

  /**
   * Validates an access token.
   * Requires the token itself for validation.
   * @param params The validation request parameters.
   * @returns The validation response.
   */
  async validateToken(params: { access_token: string }): Promise<KickTypes.TokenValidationResponse> {
    const endpoint = '/oauth2/validate';
    // The makeRequest handles adding the Bearer token
    logger.debug('Validating access token');
    return this.makeRequest<KickTypes.TokenValidationResponse>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  /**
   * Revokes an access token or refresh token.
   * Requires authentication via client credentials typically, or the token itself.
   * Kick's revoke might be simpler and just needs the token to revoke.
   * @param params The revocation request parameters.
   * @returns The revocation response.
   */
  async revokeToken(params: { access_token: string; client_id?: string; client_secret?: string }): Promise<{ success: boolean }> {
    const endpoint = '/oauth2/revoke';
     // Kick revoke seems to just need the token itself in the body
    const body = {
      token: params.access_token
    };
    logger.info('Revoking token');
    // Assuming revoke doesn't need a *different* Bearer token for the request itself
    // If it requires client credentials, adjust makeRequest or headers here.
    return this.makeRequest<{ success: boolean }>('POST', endpoint, body, {}, true, params.access_token);
  }
}
