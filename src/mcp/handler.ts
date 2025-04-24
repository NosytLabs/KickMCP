// Smithery.ai MCP Server Integration
// This file has been updated to ensure compatibility with Smithery.ai's MCP server framework

import { JSONRPCServer, JSONRPCRequest, JSONRPCResponse, JSONRPCErrorException } from 'json-rpc-2.0';
import * as readline from 'readline';
import { logger } from '../utils/logger';
// Import the main KickService aggregator
import { KickService } from '../services/kick'; // Corrected import

// Auth-related imports (ensure helpers like getAccessTokenHelper are correctly exported from auth.ts)
import {
    initiateLoginHandler,
    getAccessTokenHandler,
    refreshAccessTokenHandler,
    validateTokenHandler,
    revokeTokenHandler,
    getAccessTokenHelper,     // Helper to get access token from secure storage
    getRefreshTokenHelper,    // Helper to get refresh token from secure storage
    startAuthFlowCleanup,     // Start cleanup on init
    stopAuthFlowCleanup      // Stop cleanup on close
} from './auth'; // Import auth handlers and helpers