import { JSONRPCErrorException } from 'json-rpc-2.0';
import { logger } from '../utils/logger';
import crypto from 'crypto';
// Define TokenResponse interface for type safety
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}
import { KickService } from '../services/kick';
// Explicitly require and type pkce-challenge for CommonJS compatibility
const pkceChallenge: () => { code_verifier: string; code_challenge: string } = require('pkce-challenge');
import fs from 'fs';
import path from 'path';
// Note: 'open' is an ESM module, use dynamic import() later

// --- Temporary Storage & Cleanup ---
const authFlowStore = new Map<string, { codeVerifier: string, timestamp: number }>();
const AUTH_FLOW_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes timeout

let cleanupIntervalId: NodeJS.Timeout | null = null;

function cleanupExpiredAuthFlows() {
    const now = Date.now();
    for (const [state, data] of authFlowStore.entries()) {
        if (now - data.timestamp > AUTH_FLOW_TIMEOUT_MS) {
            authFlowStore.delete(state);
            logger.info(`Removed expired auth flow state: ${state}`);
        }
    }
}

export function startAuthFlowCleanup() {
    if (cleanupIntervalId === null) {
        cleanupIntervalId = setInterval(cleanupExpiredAuthFlows, 60 * 1000);
        logger.info('Started auth flow cleanup interval.');
    }
}

export function stopAuthFlowCleanup() {
     if (cleanupIntervalId) {
        clearInterval(cleanupIntervalId);
        cleanupIntervalId = null;
        logger.info('Stopped auth flow cleanup interval.');
    }
}

// --- Authentication Logic ---

const KICK_DEFAULT_SCOPES = "chat:read chat:write channel:read user:read"; // Example scopes

/**
 * Initiates the OAuth PKCE flow.
 */
export async function initiateLoginHandler(kickService: KickService, params: { scopes?: string }) {
    logger.info('Handling kickAuth.initiateLogin request');

    const clientId = process.env.KICK_CLIENT_ID;
    const redirectUri = process.env.KICK_REDIRECT_URI; // Static page URL or custom user URL
    const scopes = params.scopes || KICK_DEFAULT_SCOPES;

    if (!clientId || !redirectUri) {
        logger.error('Missing KICK_CLIENT_ID or KICK_REDIRECT_URI in environment variables.');
        throw new JSONRPCErrorException('Server configuration error: Missing Kick Client ID or Redirect URI.', -32001);
    }
    if (!redirectUri.startsWith('https://')) {
         logger.error(`Invalid KICK_REDIRECT_URI format: ${redirectUri}. Must use HTTPS.`);
         throw new JSONRPCErrorException('Server configuration error: Kick Redirect URI must use HTTPS.', -32001);
    }

    try {
        // pkceChallenge is synchronous
        const { code_verifier, code_challenge } = pkceChallenge();
        const state = crypto.randomBytes(16).toString('hex');

        authFlowStore.set(state, { codeVerifier: code_verifier, timestamp: Date.now() });
        logger.debug(`Stored code_verifier for state: ${state}`);

        const authUrlResponse = await kickService.getOAuthUrl({
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scopes,
            state: state,
            code_challenge: code_challenge,
            code_challenge_method: 'S256'
        });

        logger.info(`Opening browser for Kick authorization: ${authUrlResponse.url}`);
        const open = await import('open');
        await open.default(authUrlResponse.url);

        return {
            state: state,
            message: "Browser opened for Kick authorization. Please login, authorize the app, then copy the code from the callback page/redirect and use it with the 'getAccessToken' method, providing the returned 'state'."
        };
    } catch (error) {
        logger.error('Error initiating Kick login flow:', error);
        if (error instanceof JSONRPCErrorException) throw error;
        throw new JSONRPCErrorException('Failed to initiate Kick login flow.', -32000, error);
    }
}

/**
 * Exchanges the authorization code for an access token.
 */
export async function getAccessTokenHandler(kickService: KickService, params: { code: string, state: string }) {
    logger.info(`Handling getAccessToken request for state: ${params.state}`);

    const clientId = process.env.KICK_CLIENT_ID;
    const clientSecret = process.env.KICK_CLIENT_SECRET;
    const redirectUri = process.env.KICK_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        logger.error('Missing KICK_CLIENT_ID, KICK_CLIENT_SECRET, or KICK_REDIRECT_URI in environment variables.');
        throw new JSONRPCErrorException('Server configuration error: Missing Kick credentials or redirect URI.', -32001);
    }
    if (!redirectUri.startsWith('https://')) {
         logger.error(`Invalid KICK_REDIRECT_URI format: ${redirectUri}. Must use HTTPS.`);
         throw new JSONRPCErrorException('Server configuration error: Kick Redirect URI must use HTTPS.', -32001);
    }

    const flowData = authFlowStore.get(params.state);

    if (!flowData) {
        logger.error(`Invalid or expired state received: ${params.state}`);
        throw new JSONRPCErrorException('Invalid or expired state. Please initiate login again.', -32002);
    }

    authFlowStore.delete(params.state); // Clean up used state
    logger.debug(`Retrieved and removed code_verifier for state: ${params.state}`);

    if (Date.now() - flowData.timestamp > AUTH_FLOW_TIMEOUT_MS) {
         logger.error(`State timed out: ${params.state}`);
         throw new JSONRPCErrorException('Login flow timed out. Please initiate login again.', -32003);
    }

    try {
        const tokenResponse = await kickService.getAccessToken({
            client_id: clientId,
            client_secret: clientSecret,
            code: params.code,
            redirect_uri: redirectUri,
            code_verifier: flowData.codeVerifier
        }) as TokenResponse;

        logger.info(`Successfully obtained access token for state: ${params.state}`);
        // Securely store the received tokens
        if (tokenResponse.access_token) {
            secureTokenStore.setTokens(tokenResponse.access_token, tokenResponse.refresh_token || null);
        }
        return tokenResponse;

    } catch (error) {
        logger.error(`Error exchanging code for token (state: ${params.state}):`, error);
         if (error instanceof JSONRPCErrorException) throw error;
        if (error instanceof Error && error.message.includes('invalid_grant')) {
             throw new JSONRPCErrorException('Failed to exchange code for token: Invalid grant. Code might be expired or invalid.', -32004, error);
        }
        throw new JSONRPCErrorException('Failed to exchange code for access token.', -32004, error);
    }
}

// Secure token storage using plain file storage
const TOKEN_STORAGE_PATH = path.join(__dirname, '../../config/token_store.json');

const secureTokenStore = {
    setTokens(accessToken: string, refreshToken: string | null) {
        const data = { accessToken, refreshToken };
        fs.writeFileSync(TOKEN_STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    },
    getTokens(): { accessToken: string | null, refreshToken: string | null } {
        try {
            const data = JSON.parse(fs.readFileSync(TOKEN_STORAGE_PATH, 'utf-8'));
            return {
                accessToken: data.accessToken || null,
                refreshToken: data.refreshToken || null
            };
        } catch {
            return { accessToken: null, refreshToken: null };
        }
    },
    loadTokens() {
        return this.getTokens();
    },
    getAccessToken(): string | null {
        return this.getTokens().accessToken;
    },
    getRefreshToken(): string | null {
        return this.getTokens().refreshToken;
    },
    clearTokens() {
        try {
            fs.unlinkSync(TOKEN_STORAGE_PATH);
        } catch {}
    }
};

// Initialize token storage by loading existing tokens
secureTokenStore.loadTokens();

// Helper to get token, prioritizing passed param, then storage
export function getAccessTokenHelper(params: any): string {
    if (params?.access_token) {
        return params.access_token;
    }
    const storedToken = secureTokenStore.getAccessToken();
    if (!storedToken) {
        logger.error('Access token not provided in params and not found in storage.');
        throw new JSONRPCErrorException('Authentication required: Access token missing.', -32010);
    }
    return storedToken;
}

export function getRefreshTokenHelper(params: any): string {
    if (params?.refresh_token) {
        return params.refresh_token;
    }
    const storedToken = secureTokenStore.getRefreshToken();
    if (!storedToken) {
        logger.error('Refresh token not provided in params and not found in storage.');
        throw new JSONRPCErrorException('Authentication required: Refresh token missing.', -32005);
    }
    return storedToken;
}

// Resolve merge conflict here

export async function refreshAccessTokenHandler(kickService: KickService, params: any) {
    logger.info('Handling refreshAccessToken request');
    const clientId = process.env.KICK_CLIENT_ID;
    const clientSecret = process.env.KICK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new JSONRPCErrorException('Server configuration error: Missing Kick credentials.', -32001);
    }
    const refreshToken = getRefreshTokenHelper(params); // Use helper
    try {
        const response = await kickService.refreshAccessToken({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken
        });
        // Store new tokens
        if ((response as any).access_token) {
            secureTokenStore.setTokens((response as any).access_token, (response as any).refresh_token || refreshToken);
        }
        logger.info('Successfully refreshed access token.');
        return response;
    } catch (error) {
        logger.error('Error refreshing access token:', error);
        throw new JSONRPCErrorException('Failed to refresh access token.', -32006, error);
    }
}

export async function validateTokenHandler(kickService: KickService, params: any) {
    logger.info('Handling validateToken request');
    const accessToken = getAccessTokenHelper(params); // Use helper
    return await kickService.validateToken({ access_token: accessToken });
}

export async function revokeTokenHandler(kickService: KickService, params: any) {
    logger.info('Handling revokeToken request');
    const accessToken = getAccessTokenHelper(params); // Use helper
    try {
        const response = await kickService.revokeToken({ access_token: accessToken });
        logger.info('Successfully revoked access token.');
        secureTokenStore.clearTokens(); // Clear stored tokens after revocation
        return response;
    } catch (error) {
        logger.error('Error revoking access token:', error);
        throw new JSONRPCErrorException('Failed to revoke access token.', -32009, error);
    }
}