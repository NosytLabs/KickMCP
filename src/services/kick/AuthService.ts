import { BaseKickService } from './BaseKickService';
import * as KickTypes from '../../types/kick';
import { logger } from '../../utils/logger';

/**
 * Service for handling Kick API Authentication methods.
 */
export class AuthService extends BaseKickService {
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
    return this.makeRequest<{ success: boolean }>('POST', endpoint, body, {