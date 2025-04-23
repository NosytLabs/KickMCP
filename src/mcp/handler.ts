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

// Temporary storage and cleanup logic moved to auth.ts

// --- Define tool schemas ---

// Define required scopes (consider making this configurable)
const KICK_DEFAULT_SCOPES = "chat:read chat:write channel:read user:read"; // Example scopes

// Helper function to create schema with common patterns
const createMethodSchema = (name: string, description: string, properties = {}, required: string[] = []) => ({
    name,
    description,
    inputSchema: {
        type: 'object',
        properties: {
            ...properties,
            access_token: {
                type: 'string',
                description: 'Optional: Access token (if not securely stored server-side)'
            }
        },
        required
    }
});

const toolSchemas = [
    // --- NEW Authentication Orchestration Method ---
    {
        name: 'kickAuth.initiateLogin',
        description: 'Starts the Kick OAuth PKCE flow, generates URL, opens browser. Returns state for linking.',
        inputSchema: {
            type: 'object',
            properties: {
                scopes: {
                    type: 'string',
                    description: `Optional: Space-separated list of scopes. Defaults to: ${KICK_DEFAULT_SCOPES}`
                }
            },
            required: [] 
        }
    },
    // Authentication Methods Schemas (getOAuthUrl schema removed)
    {
        name: 'getAccessToken',
        description: 'Exchange authorization code for access token using state from initiateLogin.',
        inputSchema: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'Authorization code received from the callback/redirect.'
                },
                state: {
                    type: 'string',
                    description: 'The state value returned by initiateLogin to link this request.'
                }
                // client_id, client_secret, redirect_uri are read from env vars server-side
                // code_verifier is retrieved using the state
            },
            required: ['code', 'state']
        }
    },
  {
    name: 'refreshAccessToken',
    description: 'Refresh expired token using stored refresh token (if available) or provided one.',
    inputSchema: {
      type: 'object',
      properties: {
        // client_id and client_secret are read from env vars server-side
        refresh_token: { // Optional: client can provide if not stored yet
          type: 'string',
          description: 'Optional: Refresh token (if not securely stored server-side yet)'
        }
      },
      required: [] // No longer required from client if stored server-side
    }
  },
  {
    name: 'validateToken',
    description: 'Validate access token',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: { // Optional: client can provide if not stored yet
          type: 'string',
          description: 'Optional: Access token to validate (if not securely stored server-side yet)'
        }
      },
      required: [] // No longer required from client if stored server-side
    }
  },
  {
    name: 'revokeToken',
    description: 'Revoke access token',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: { // Optional: client can provide if not stored yet
          type: 'string',
          description: 'Optional: Access token to revoke (if not securely stored server-side yet)'
        }
      },
      required: [] // No longer required from client if stored server-side
    }
  },

  // --- Schemas for other KickService methods ---
  // (Assuming access_token will be retrieved server-side via secure storage eventually)
  // (For now, many might still require access_token param until storage is implemented)

  // User Methods Schemas
  { name: 'getUserProfile', description: 'Get user profile', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'updateUserProfile', description: 'Update user profile', inputSchema: { type: 'object', properties: { data: { type: 'object' } }, required: ['data'] } },
  { name: 'getUserSubscriptions', description: 'Get user subscriptions', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserEmotes', description: 'Get user emotes', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserBadges', description: 'Get user badges', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserFollows', description: 'Get followed channels', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserBlockedUsers', description: 'Get blocked users', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserClips', description: 'Get user clips', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserVideos', description: 'Get user videos', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserHighlights', description: 'Get user highlights', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserScheduledStreams', description: 'Get scheduled streams', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserNotifications', description: 'Get notifications', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserWallet', description: 'Get wallet info', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getUserGifts', description: 'Get gift history', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },

  // Chat Methods Schemas
  { name: 'getChatHistory', description: 'Get chat history', inputSchema: { type: 'object', properties: { channel_id: { type: 'string' }, limit: { type: 'number' }, before: { type: 'string' }, after: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'sendChatMessage', description: 'Send chat message', inputSchema: { type: 'object', properties: { channel_id: { type: 'string' }, message: { type: 'string' }, reply_to: { type: 'string' } }, required: ['channel_id', 'message'] } },
  { name: 'banUser', description: 'Ban user from chat', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, user_id: { type: 'string' } }, required: ['channel_id', 'user_id'] } },
  { name: 'unbanUser', description: 'Unban user from chat', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, user_id: { type: 'string' } }, required: ['channel_id', 'user_id'] } },
  { name: 'timeoutUser', description: 'Timeout user', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, user_id: { type: 'string' }, duration: { type: 'integer' } }, required: ['channel_id', 'user_id', 'duration'] } },
  { name: 'deleteChatMessage', description: 'Delete chat message', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, message_id: { type: 'string' } }, required: ['channel_id', 'message_id'] } },
  { name: 'clearChat', description: 'Clear all chat messages', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },

  // Channel Methods Schemas
  { name: 'getChannelInfo', description: 'Get channel info', inputSchema: { type: 'object', properties: { channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelFollowers', description: 'Get channel followers', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelSubscribers', description: 'Get channel subscribers', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelEmotes', description: 'Get channel emotes', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelBadges', description: 'Get channel badges', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelModerators', description: 'Get channel moderators', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelBans', description: 'Get channel banned users', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelVips', description: 'Get channel VIP users', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelClips', description: 'Get channel clips', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelVideos', description: 'Get channel videos', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelHighlights', description: 'Get channel highlights', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelScheduledStreams', description: 'Get channel scheduled streams', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelChatRules', description: 'Get channel chat rules', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelChatCommands', description: 'Get channel chat commands', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelCategories', description: 'Get channel categories', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelTags', description: 'Get channel tags', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelGifts', description: 'Get channel gifts', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelRaids', description: 'Get channel raid history', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelHosts', description: 'Get channel host history', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getChannelSettings', description: 'Get channel settings', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'updateChannelSettings', description: 'Update channel settings', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, data: { type: 'object' } }, required: ['channel_id', 'data'] } },

  // Stream Methods Schemas
  { name: 'getLivestreams', description: 'Get list of current livestreams', inputSchema: { type: 'object', properties: {}, required: [] } }, // No params needed
  { name: 'getLivestreamBySlug', description: 'Get livestream by slug', inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] } },
  { name: 'startStream', description: 'Start streaming', inputSchema: { type: 'object', properties: { channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'endStream', description: 'End stream', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'updateStreamInfo', description: 'Update stream information', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, data: { type: 'object' } }, required: ['channel_id', 'data'] } },
  { name: 'updateStreamSettings', description: 'Update stream settings', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, data: { type: 'object' } }, required: ['channel_id', 'data'] } },
  { name: 'getStreamInfo', description: 'Get stream information', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getStreamViewers', description: 'Get stream viewers', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getStreamCategories', description: 'Get stream categories', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getStreamTags', description: 'Get stream tags', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getStreamStats', description: 'Get stream statistics', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'createPoll', description: 'Create stream poll', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, title: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, duration: { type: 'number' } }, required: ['channel_id', 'title', 'options', 'duration'] } },
  { name: 'endPoll', description: 'End stream poll', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, poll_id: { type: 'string' } }, required: ['channel_id', 'poll_id'] } },
  { name: 'createPrediction', description: 'Create stream prediction', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, title: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, duration: { type: 'number' } }, required: ['channel_id', 'title', 'options', 'duration'] } },
  { name: 'endPrediction', description: 'End stream prediction', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, prediction_id: { type: 'string' }, winning_outcome_id: { type: 'string' } }, required: ['channel_id', 'prediction_id', 'winning_outcome_id'] } },
  { name: 'createMarker', description: 'Create stream marker (deprecated, use createStreamMarker)', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, description: { type: 'string' } }, required: ['channel_id', 'description'] } },
  { name: 'getStreamMarkers', description: 'Get stream markers', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'createStreamMarker', description: 'Create stream marker', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, description: { type: 'string' } }, required: ['channel_id', 'description'] } },
  { name: 'startRaid', description: 'Start a raid', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, target_channel_id: { type: 'string' } }, required: ['channel_id', 'target_channel_id'] } },
  { name: 'cancelRaid', description: 'Cancel a raid', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'startHost', description: 'Start hosting a channel', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, target_channel_id: { type: 'string' } }, required: ['channel_id', 'target_channel_id'] } },
  { name: 'endHost', description: 'End hosting', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getStreamQualitySettings', description: 'Get stream quality settings', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'updateStreamQualitySettings', description: 'Update stream quality settings', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, data: { type: 'object' } }, required: ['channel_id', 'data'] } },

  // Webhook Methods Schemas
  { name: 'createWebhook', description: 'Create webhook', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, url: { type: 'string' }, events: { type: 'array', items: { type: 'string' } } }, required: ['url', 'events'] } },
  { name: 'deleteWebhook', description: 'Delete webhook', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, webhook_id: { type: 'string' } }, required: ['webhook_id'] } },
  { name: 'listWebhooks', description: 'List webhooks', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'getWebhookEvents', description: 'Get available webhook event types', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' } }, required: [] } },
  { name: 'verifyWebhookSignature', description: 'Verify webhook signature (helper, logic external)', inputSchema: { type: 'object', properties: { signature: { type: 'string' }, message_id: { type: 'string' }, timestamp: { type: 'string' }, body: { type: 'any' } }, required: ['signature', 'message_id', 'timestamp', 'body'] } },
  { name: 'getWebhookPayloads', description: 'Get example webhook payloads', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, event_type: { type: 'string' } }, required: ['event_type'] } },
  { name: 'retryWebhook', description: 'Retry a failed webhook delivery', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, webhook_id: { type: 'string' }, message_id: { type: 'string' } }, required: ['webhook_id', 'message_id'] } },
  { name: 'checkWebhookSubscriptionStatus', description: 'Check webhook subscription status', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, subscription_id: { type: 'string' } }, required: ['subscription_id'] } },
  { name: 'updateWebhookSubscriptions', description: 'Update webhook subscriptions', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, webhook_id: { type: 'string' }, subscriptions: { type: 'array', items: { type: 'string' } } }, required: ['webhook_id', 'subscriptions'] } },

  // Clips Methods Schemas
  { name: 'createClip', description: 'Create a clip', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, title: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getClip', description: 'Get clip details', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, clip_id: { type: 'string' } }, required: ['clip_id'] } },
  { name: 'updateClip', description: 'Update clip title', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, clip_id: { type: 'string' }, title: { type: 'string' } }, required: ['clip_id', 'title'] } },
  { name: 'deleteClip', description: 'Delete a clip', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, clip_id: { type: 'string' } }, required: ['clip_id'] } },

  // Subscriptions Methods Schemas
  { name: 'getChannelSubscriptions', description: 'Get channel subscriptions', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'getSubscriptionTiers', description: 'Get subscription tiers', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'updateSubscriptionTier', description: 'Update subscription tier', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, tier_id: { type: 'string' }, data: { type: 'object' } }, required: ['channel_id', 'tier_id', 'data'] } },

  // Chat Rules Methods Schemas
  { name: 'getChatRules', description: 'Get chat rules', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' } }, required: ['channel_id'] } },
  { name: 'createChatRule', description: 'Create chat rule', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, rule: { type: 'string' } }, required: ['channel_id', 'rule'] } },
  { name: 'updateChatRule', description: 'Update chat rule', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, rule_id: { type: 'string' }, rule: { type: 'string' } }, required: ['channel_id', 'rule_id', 'rule'] } },
  { name: 'deleteChatRule', description: 'Delete chat rule', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, rule_id: { type: 'string' } }, required: ['channel_id', 'rule_id'] } },

  // Misc Channel Methods Schemas
  { name: 'addChannelVIP', description: 'Add channel VIP', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, user_id: { type: 'string' } }, required: ['channel_id', 'user_id'] } },
  { name: 'removeChannelVIP', description: 'Remove channel VIP', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, user_id: { type: 'string' } }, required: ['channel_id', 'user_id'] } },
  { name: 'addChannelModerator', description: 'Add channel moderator', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, user_id: { type: 'string' } }, required: ['channel_id', 'user_id'] } },
  { name: 'removeChannelModerator', description: 'Remove channel moderator', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, user_id: { type: 'string' } }, required: ['channel_id', 'user_id'] } },
  { name: 'createChatCommand', description: 'Create chat command', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, command: { type: 'string' }, response: { type: 'string' } }, required: ['channel_id', 'command', 'response'] } },
  { name: 'updateChatCommand', description: 'Update chat command', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, command_id: { type: 'string' }, command: { type: 'string' }, response: { type: 'string' } }, required: ['channel_id', 'command_id'] } },
  { name: 'deleteChatCommand', description: 'Delete chat command', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, command_id: { type: 'string' } }, required: ['channel_id', 'command_id'] } },
  { name: 'getPollResults', description: 'Get poll results', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, poll_id: { type: 'string' } }, required: ['channel_id', 'poll_id'] } },
  { name: 'getPredictionResults', description: 'Get prediction results', inputSchema: { type: 'object', properties: { access_token: { type: 'string', description: 'Optional: Access token (if not securely stored server-side)' }, channel_id: { type: 'string' }, prediction_id: { type: 'string' } }, required: ['channel_id', 'prediction_id'] } },

  // App Access Token Schema
  { name: 'getAppAccessToken', description: 'Get app access token (Client Credentials)', inputSchema: { type: 'object', properties: {}, required: [] } }, // No params needed from client

  // Add other schemas based on KickService methods...
];


/**
 * Setup and handle JSON-RPC over stdin/stdout for MCP
 */
/**
 * Setup and handle JSON-RPC over stdin/stdout for MCP
 * @param kickService An instance of the KickService aggregator
 */
export const setupMCPHandler = (kickService: KickService): void => {
    // Create JSON-RPC server
    const jsonRpcServer = new JSONRPCServer();

    // --- Register Methods ---

    // Helper function to register methods with consistent logging and error handling
    const registerMethod = (method: string, handler: Function, service?: keyof KickService) => {
        jsonRpcServer.addMethod(method, async (params) => {
            logger.info(`Handling ${method} request`);
            try {
                if (service) {
                    return await handler(kickService[service], params);
                }
                return await handler(params);
            } catch (error) {
                logger.error(`Error in ${method}:`, error);
                throw new JSONRPCErrorException(`Failed to process ${method}: ${(error as Error).message}`, -32012);
            }
        });
    };

    // --- Authentication Methods ---
    registerMethod('kickAuth.initiateLogin', initiateLoginHandler, 'auth');
    registerMethod('getAccessToken', getAccessTokenHandler, 'auth');
    registerMethod('refreshAccessToken', refreshAccessTokenHandler, 'auth');
    registerMethod('validateToken', validateTokenHandler, 'auth');
    registerMethod('revokeToken', revokeTokenHandler, 'auth');


    // --- Register other KickService methods ---
    // Helper function to get access token from secure storage with minimized fallback to params
    const getStoredAccessToken = async (): Promise<string> => {
        try {
            const token = await getAccessTokenHelper(kickService);
            if (token) {
                logger.debug('Successfully retrieved access token from secure storage.');
                return token;
            }
    
            logger.warn('Access token not found in secure storage.');
            throw new JSONRPCErrorException('Access token not available. Please log in using `kickAuth.initiateLogin` followed by `getAccessToken`.', -32010);
    
        } catch (error: any) {
            logger.error('Error retrieving access token:', error);
            if (error instanceof JSONRPCErrorException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new JSONRPCErrorException('Failed to retrieve access token.', -32011, errorMessage);
        }
    // Register all the method handlers for the KickService
    // This will be implemented in the next section
    
    // Start the cleanup process for auth flows
    startAuthFlowCleanup();
    
    // Setup readline interface for JSON-RPC
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    // Handle incoming JSON-RPC requests
    rl.on('line', async (line) => {
        try {
            const request = JSON.parse(line) as JSONRPCRequest;
            const response = await jsonRpcServer.receive(request);
            if (response) {
                console.log(JSON.stringify(response));
            }
        } catch (error) {
            logger.error('Error processing request:', error);
            const errorResponse: JSONRPCResponse = {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error',
                    data: error instanceof Error ? error.message : 'Unknown error'
                }
            };
            console.log(JSON.stringify(errorResponse));
        }
    });

    // Cleanup on process exit
    process.on('exit', () => {
        stopAuthFlowCleanup();
        rl.close();
    });
}

    // Basic rate-limiting mechanism to prevent abuse
    const rateLimit: { [method: string]: { lastCall: number, callCount: number, limit: number, window: number } } = {};
    const applyRateLimit = (method: string): void => {
        const now = Date.now();
        if (!rateLimit[method]) {
    // Configurable rate limiting for Smithery.ai performance guidelines
    const callsPerMinute = parseInt(process.env.RATE_LIMIT_CALLS_PER_MINUTE || '10', 10);
    const rateLimiter = new RateLimiter(callsPerMinute, 60000);

            rateLimit[method] = { lastCall: now, callCount: 1, limit: 10, window: 60000 }; // 10 calls per minute
            return;
        }
        const config = rateLimit[method];
        if (now - config.lastCall < config.window) {
            config.callCount++;
            if (config.callCount > config.limit) {
                logger.warn(`Rate limit exceeded for method: ${method}`);
                throw new JSONRPCErrorException(`Rate limit exceeded for ${method}. Please try again later.`, -32013);
            }
        } else {
            config.callCount = 1;
            config.lastCall = now;
        }
    // Register all the method handlers for the KickService
    // This will be implemented in the next section
    
    // Start the cleanup process for auth flows
    startAuthFlowCleanup();
    
    // Setup readline interface for JSON-RPC
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    // Handle incoming JSON-RPC requests
    rl.on('line', async (line) => {
        try {
            const request = JSON.parse(line) as JSONRPCRequest;
            const response = await jsonRpcServer.receive(request);
            if (response) {
                console.log(JSON.stringify(response));
            }
        } catch (error) {
            logger.error('Error processing request:', error);
            const errorResponse: JSONRPCResponse = {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error',
                    data: error instanceof Error ? error.message : 'Unknown error'
                }
            };
            console.log(JSON.stringify(errorResponse));
        }
    });

    // Cleanup on process exit
    process.on('exit', () => {
        stopAuthFlowCleanup();
        rl.close();
    });
}

    // User Methods - Use kickService.user with rate-limiting
    jsonRpcServer.addMethod('getUserProfile', async (params) => {
        logger.info('Handling getUserProfile request');
        applyRateLimit('getUserProfile');
        const accessToken = await getStoredAccessToken(params); // Pass params for potential fallback access
        return await kickService.user.getUserProfile({ access_token: accessToken });
    });
    jsonRpcServer.addMethod('updateUserProfile', async (params) => {
        logger.info('Handling updateUserProfile request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.user.updateUserProfile({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserSubscriptions', async (params) => {
        logger.info('Handling getUserSubscriptions request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.user.getUserSubscriptions({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserEmotes', async (params) => {
        logger.info('Handling getUserEmotes request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.user.getUserEmotes({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserBadges', async (params) => {
        logger.info('Handling getUserBadges request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.user.getUserBadges({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserFollows', async (params) => {
        logger.info('Handling getUserFollows request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.user.getUserFollows({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserBlockedUsers', async (params) => {
        logger.info('Handling getUserBlockedUsers request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.user.getUserBlockedUsers({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserClips', async (params) => {
        logger.info('Handling getUserClips request');
        applyRateLimit('getUserClips');
        const accessToken = await getStoredAccessToken(params);
        // Resolved: Clips are under user service as per current implementation
        return await kickService.user.getUserClips({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserVideos', async (params) => {
        logger.info('Handling getUserVideos request');
        applyRateLimit('getUserVideos');
        const accessToken = await getStoredAccessToken(params);
        // Resolved: Videos are under user service as per current implementation
        return await kickService.user.getUserVideos({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserHighlights', async (params) => {
        logger.info('Handling getUserHighlights request');
        applyRateLimit('getUserHighlights');
        const accessToken = await getStoredAccessToken(params);
        // Resolved: Highlights are under user service as per current implementation
        return await kickService.user.getUserHighlights({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserScheduledStreams', async (params) => {
        logger.info('Handling getUserScheduledStreams request');
        applyRateLimit('getUserScheduledStreams');
        const accessToken = await getStoredAccessToken(params);
        // Resolved: Scheduled streams are under user service as per current implementation
        return await kickService.user.getUserScheduledStreams({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserNotifications', async (params) => {
        logger.info('Handling getUserNotifications request');
        applyRateLimit('getUserNotifications');
        const accessToken = await getStoredAccessToken(params);
        // Resolved: Notifications are under user service as per current implementation
        return await kickService.user.getUserNotifications({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserWallet', async (params) => {
        logger.info('Handling getUserWallet request');
        applyRateLimit('getUserWallet');
        const accessToken = await getStoredAccessToken(params);
        // Resolved: Wallet is under user service as per current implementation
        return await kickService.user.getUserWallet({ access_token: accessToken });
    });
    jsonRpcServer.addMethod('getUserGifts', async (params) => {
        logger.info('Handling getUserGifts request');
        const accessToken = await getStoredAccessToken(params);
        // TODO: Verify endpoint and service for gifts
        return await kickService.user.getUserGifts({ access_token: accessToken });
    });

    // Chat Methods
    jsonRpcServer.addMethod('getChatHistory', async (params) => { // Corrected name
        logger.info('Handling getChatHistory request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.chat.getChatHistory({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('sendChatMessage', async (params) => {
        logger.info('Handling sendChatMessage request');
        try {
            const accessToken = await getStoredAccessToken(params);
            return await kickService.chat.sendChatMessage({ ...params as any, access_token: accessToken });
        } catch (error) {
            logger.error('Error in sendChatMessage:', error);
            throw new JSONRPCErrorException('Failed to send chat message: ' + (error as Error).message, -32012);
        }
    });
    // Removed getChatSettings registration (use getChannelSettings)
    jsonRpcServer.addMethod('banUser', async (params) => {
        logger.info('Handling banUser request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.chat.banUser({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('unbanUser', async (params) => {
        logger.info('Handling unbanUser request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.chat.unbanUser({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('timeoutUser', async (params) => {
        logger.info('Handling timeoutUser request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.chat.timeoutUser({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('deleteChatMessage', async (params) => { // Corrected name
        logger.info('Handling deleteChatMessage request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.chat.deleteChatMessage({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('clearChat', async (params) => {
        logger.info('Handling clearChat request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.chat.clearChat({ ...params as any, access_token: accessToken });
    });
    // Removed getChatUserInfo registration

    // Channel Methods
    jsonRpcServer.addMethod('getChannelInfo', async (params) => {
        logger.info('Handling getChannelInfo request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelInfo({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelFollowers', async (params) => {
        logger.info('Handling getChannelFollowers request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelFollowers({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelSubscribers', async (params) => {
        logger.info('Handling getChannelSubscribers request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelSubscribers({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelEmotes', async (params) => {
        logger.info('Handling getChannelEmotes request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelEmotes({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelBadges', async (params) => {
        logger.info('Handling getChannelBadges request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelBadges({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelModerators', async (params) => {
        logger.info('Handling getChannelModerators request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelModerators({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelBans', async (params) => {
        logger.info('Handling getChannelBans request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelBans({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelVips', async (params) => {
        logger.info('Handling getChannelVips request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelVips({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelClips', async (params) => {
        logger.info('Handling getChannelClips request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelClips({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelVideos', async (params) => {
        logger.info('Handling getChannelVideos request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelVideos({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelHighlights', async (params) => {
        logger.info('Handling getChannelHighlights request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelHighlights({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelScheduledStreams', async (params) => {
        logger.info('Handling getChannelScheduledStreams request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChannelScheduledStreams({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelChatRules', async (params) => {
        logger.info('Handling getChannelChatRules request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChatRules({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelChatCommands', async (params) => {
        logger.info('Handling getChannelChatCommands request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getChatCommands({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelCategories', async (params) => {
        logger.info('Handling getChannelCategories request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getCategories({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelTags', async (params) => {
        logger.info('Handling getChannelTags request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getTags({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelGifts', async (params) => {
        logger.info('Handling getChannelGifts request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getGifts({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelRaids', async (params) => {
        logger.info('Handling getChannelRaids request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getRaids({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelHosts', async (params) => {
        logger.info('Handling getChannelHosts request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getHosts({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getChannelSettings', async (params) => { // Added based on service method
        logger.info('Handling getChannelSettings request');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.getSettings({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('updateChannelSettings', async (params) => {
        logger.info('Handling updateChannelSettings request');
        applyRateLimit('updateChannelSettings');
        const accessToken = await getStoredAccessToken(params);
        return await kickService.channel.updateChannelSettings({ ...params as any, access_token: accessToken });
    });


    // Stream Methods
    jsonRpcServer.addMethod('getLivestreams', async () => { // Corrected: No params
        logger.info('Handling getLivestreams request');
        return await kickService.stream.getLivestreams();
    });
    jsonRpcServer.addMethod('getLivestreamBySlug', async (params) => {
        logger.info('Handling getLivestreamBySlug request');
         // This method might not require user auth, check KickService
        return await kickService.stream.getLivestreamBySlug(params as any); // Assuming public or app token
    });
    jsonRpcServer.addMethod('startStream', async (params) => {
        logger.info('Handling startStream request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.startStream({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('endStream', async (params) => {
        logger.info('Handling endStream request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.endStream({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('updateStreamInfo', async (params) => {
        logger.info('Handling updateStreamInfo request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.updateStreamInfo({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('updateStreamSettings', async (params) => {
        logger.info('Handling updateStreamSettings request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.updateStreamSettings({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getStreamInfo', async (params) => {
        logger.info('Handling getStreamInfo request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getStreamInfo({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getStreamViewers', async (params) => {
        logger.info('Handling getStreamViewers request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getStreamViewers({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getStreamCategories', async (params) => {
        logger.info('Handling getStreamCategories request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getStreamCategories({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getStreamTags', async (params) => {
        logger.info('Handling getStreamTags request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getStreamTags({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getStreamStats', async (params) => {
        logger.info('Handling getStreamStats request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getStreamStats({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('createPoll', async (params) => {
        logger.info('Handling createPoll request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.createPoll({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('endPoll', async (params) => {
        logger.info('Handling endPoll request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.endPoll({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('createPrediction', async (params) => {
        logger.info('Handling createPrediction request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.createPrediction({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('endPrediction', async (params) => {
        logger.info('Handling endPrediction request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.endPrediction({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('createMarker', async (params) => {
        logger.info('Handling createMarker request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.createMarker({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getStreamMarkers', async (params) => { // Added based on service
        logger.info('Handling getStreamMarkers request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getStreamMarkers({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('createStreamMarker', async (params) => { // Added based on service
        logger.info('Handling createStreamMarker request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.createStreamMarker({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('startRaid', async (params) => { // Added based on service
        logger.info('Handling startRaid request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.startRaid({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('cancelRaid', async (params) => { // Added based on service
        logger.info('Handling cancelRaid request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.cancelRaid({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('startHost', async (params) => { // Added based on service
        logger.info('Handling startHost request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.startHost({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('endHost', async (params) => { // Added based on service
        logger.info('Handling endHost request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.endHost({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getStreamQualitySettings', async (params) => { // Added based on service
        logger.info('Handling getStreamQualitySettings request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getStreamQualitySettings({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('updateStreamQualitySettings', async (params) => { // Added based on service
        logger.info('Handling updateStreamQualitySettings request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.updateStreamQualitySettings({ ...params as any, access_token: accessToken });
    });


    // Webhooks (Requires App Access Token or User Token depending on endpoint)
    // Note: Webhook creation/deletion often uses App tokens, verification is separate.
    jsonRpcServer.addMethod('createWebhook', async (params) => {
        logger.info('Handling createWebhook request');
        // TODO: Determine if user or app token is needed, retrieve appropriately
        const accessToken = getStoredAccessToken(params); // Assuming user token for now
        return await kickService.stream.createWebhook({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('deleteWebhook', async (params) => {
        logger.info('Handling deleteWebhook request');
         // TODO: Determine if user or app token is needed, retrieve appropriately
        const accessToken = getStoredAccessToken(params); // Assuming user token for now
        return await kickService.stream.deleteWebhook({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('listWebhooks', async (params) => {
        logger.info('Handling listWebhooks request');
         // TODO: Determine if user or app token is needed, retrieve appropriately
        const accessToken = getStoredAccessToken(params); // Assuming user token for now
        return await kickService.stream.listWebhooks({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getWebhookEvents', async (params) => {
        logger.info('Handling getWebhookEvents request');
         // TODO: Determine if user or app token is needed, retrieve appropriately
        const accessToken = getStoredAccessToken(params); // Assuming user token for now
        return await kickService.stream.getWebhookEvents({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('verifyWebhookSignature', async (params) => {
        // This likely doesn't need an access token, just the signature details
        logger.info('Handling verifyWebhookSignature request');
        return await kickService.stream.verifyWebhookSignature(params as any);
    });
    jsonRpcServer.addMethod('getWebhookPayloads', async (params) => {
        logger.info('Handling getWebhookPayloads request');
         // TODO: Determine if user or app token is needed, retrieve appropriately
        const accessToken = getStoredAccessToken(params); // Assuming user token for now
        return await kickService.stream.getWebhookPayloads({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('retryWebhook', async (params) => {
        logger.info('Handling retryWebhook request');
         // TODO: Determine if user or app token is needed, retrieve appropriately
        const accessToken = getStoredAccessToken(params); // Assuming user token for now
        return await kickService.stream.retryWebhook({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('checkWebhookSubscriptionStatus', async (params) => {
        logger.info('Handling checkWebhookSubscriptionStatus request');
         // TODO: Determine if user or app token is needed, retrieve appropriately
        const accessToken = getStoredAccessToken(params); // Assuming user token for now
        return await kickService.stream.checkWebhookSubscriptionStatus({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('updateWebhookSubscriptions', async (params) => {
        logger.info('Handling updateWebhookSubscriptions request');
         // TODO: Determine if user or app token is needed, retrieve appropriately
        const accessToken = getStoredAccessToken(params); // Assuming user token for now
        return await kickService.stream.updateWebhookSubscriptions({ ...params as any, access_token: accessToken });
    });

    // Clips
    jsonRpcServer.addMethod('createClip', async (params) => {
        logger.info('Handling createClip request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.createClip({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('getClip', async (params) => {
        logger.info('Handling getClip request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getClip({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('updateClip', async (params) => {
        logger.info('Handling updateClip request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.updateClip({ ...params as any, access_token: accessToken });
    });
    jsonRpcServer.addMethod('deleteClip', async (params) => {
        logger.info('Handling deleteClip request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.deleteClip({ ...params as any, access_token: accessToken });
    });

     // Subscriptions (Added based on service)
     jsonRpcServer.addMethod('getChannelSubscriptions', async (params) => {
        logger.info('Handling getChannelSubscriptions request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.channel.getSubscriptions({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getSubscriptionTiers', async (params) => {
        logger.info('Handling getSubscriptionTiers request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.channel.getSubscriptionTiers({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('updateSubscriptionTier', async (params) => {
        logger.info('Handling updateSubscriptionTier request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.channel.updateSubscriptionTier({ ...params as any, access_token: accessToken });
    });

     // Chat Rules (Added based on service)
     jsonRpcServer.addMethod('getChatRules', async (params) => {
        logger.info('Handling getChatRules request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.chat.getChatRules({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('createChatRule', async (params) => {
        logger.info('Handling createChatRule request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.chat.createChatRule({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('updateChatRule', async (params) => {
        logger.info('Handling updateChatRule request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.chat.updateChatRule({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('deleteChatRule', async (params) => {
        logger.info('Handling deleteChatRule request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.chat.deleteChatRule({ ...params as any, access_token: accessToken });
    });

     // Misc Channel (Added based on service)
     jsonRpcServer.addMethod('addChannelVIP', async (params) => {
        logger.info('Handling addChannelVIP request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.channel.addVIP({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('removeChannelVIP', async (params) => {
        logger.info('Handling removeChannelVIP request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.channel.removeVIP({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('addChannelModerator', async (params) => {
        logger.info('Handling addChannelModerator request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.channel.addModerator({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('removeChannelModerator', async (params) => {
        logger.info('Handling removeChannelModerator request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.channel.removeModerator({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('createChatCommand', async (params) => {
        logger.info('Handling createChatCommand request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.chat.createChatCommand({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('updateChatCommand', async (params) => {
        logger.info('Handling updateChatCommand request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.chat.updateChatCommand({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('deleteChatCommand', async (params) => {
        logger.info('Handling deleteChatCommand request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.chat.deleteChatCommand({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getPollResults', async (params) => {
        logger.info('Handling getPollResults request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getPollResults({ ...params as any, access_token: accessToken });
    });
     jsonRpcServer.addMethod('getPredictionResults', async (params) => {
        logger.info('Handling getPredictionResults request');
        const accessToken = getStoredAccessToken(params);
        return await kickService.stream.getPredictionResults({ ...params as any, access_token: accessToken });
    });


    // App Access Token (Client Credentials - Reads from ENV)
    jsonRpcServer.addMethod('getAppAccessToken', async () => { // Removed params
        logger.info('Handling getAppAccessToken request');
         // Read client_id/secret from env vars for security
        const clientId = process.env.KICK_CLIENT_ID;
        const clientSecret = process.env.KICK_CLIENT_SECRET;
         if (!clientId || !clientSecret) {
            logger.error('Missing KICK_CLIENT_ID or KICK_CLIENT_SECRET in environment variables.');
            throw new JSONRPCErrorException('Server configuration error: Missing Kick credentials.', -32001);
        }
        return await kickService.getAppAccessToken({
            client_id: clientId,
            client_secret: clientSecret
        });
    });


    // --- MCP Standard Methods ---
    // Add Smithery.ai-specific metadata to server information
    serverInfo.metadata = {
      platform: 'Smithery.ai',
      version: '1.0.0',
      compliant: true
    }
    // Register all the method handlers for the KickService
    // This will be implemented in the next section
    
    // Start the cleanup process for auth flows
    startAuthFlowCleanup();
    
    // Setup readline interface for JSON-RPC
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    // Handle incoming JSON-RPC requests
    rl.on('line', async (line) => {
        try {
            const request = JSON.parse(line) as JSONRPCRequest;
            const response = await jsonRpcServer.receive(request);
            if (response) {
                console.log(JSON.stringify(response));
            }
        } catch (error) {
            logger.error('Error processing request:', error);
            const errorResponse: JSONRPCResponse = {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error',
                    data: error instanceof Error ? error.message : 'Unknown error'
                }
            };
            console.log(JSON.stringify(errorResponse));
        }
    });

    // Cleanup on process exit
    process.on('exit', () => {
        stopAuthFlowCleanup();
        rl.close();
    });
}

    jsonRpcServer.addMethod('initialize', async () => {
        logger.info('MCP Initialized');
        // Perform any server initialization if needed
        // Ensure required ENV VARS are set for the primary auth flow
         if (!process.env.KICK_CLIENT_ID || !process.env.KICK_CLIENT_SECRET || !process.env.KICK_REDIRECT_URI) {
            logger.warn('Missing KICK_CLIENT_ID, KICK_CLIENT_SECRET, or KICK_REDIRECT_URI environment variables. User authentication flow may fail.');
            // Allow initialization but warn the user/operator
            startAuthFlowCleanup(); // Start cleanup regardless
            return { success: true, warning: 'Missing required Kick configuration environment variables for user auth.' };
        }
         if (!process.env.KICK_REDIRECT_URI.startsWith('https://')) {
             logger.warn(`KICK_REDIRECT_URI (${process.env.KICK_REDIRECT_URI}) does not use HTTPS. Kick requires HTTPS for redirect URIs.`);
              startAuthFlowCleanup(); // Start cleanup regardless
             return { success: true, warning: 'KICK_REDIRECT_URI does not use HTTPS, authentication may fail.' };
         }
        logger.info(`Using Kick Redirect URI: ${process.env.KICK_REDIRECT_URI}`);
        startAuthFlowCleanup(); // Start the cleanup interval
        return { success: true };
    });

    jsonRpcServer.addMethod('tools/list', async () => {
        logger.info('Handling tools/list request');
        // Dynamically add/remove methods based on config or auth state if needed
        return { tools: toolSchemas };
    });

    // --- Start Listening ---
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout, // Required by readline, though we write directly
        terminal: false
    });

    // Implement dynamic tool list updates
    const updateToolList = () => {
      const updatedSchemas = kickService.getAllMethods().map(method => ({
        name: `kick/${method}`,
        description: `Dynamically updated method for ${method}`,
        inputSchema: { type: 'object', properties: {}, required: [] }
      }));
      toolSchemas.push(...updatedSchemas.filter(schema => !toolSchemas.some(existing => existing.name === schema.name)));
    // Register all the method handlers for the KickService
    // This will be implemented in the next section
    
    // Start the cleanup process for auth flows
    startAuthFlowCleanup();
    
    // Setup readline interface for JSON-RPC
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    // Handle incoming JSON-RPC requests
    rl.on('line', async (line) => {
        try {
            const request = JSON.parse(line) as JSONRPCRequest;
            const response = await jsonRpcServer.receive(request);
            if (response) {
                console.log(JSON.stringify(response));
            }
        } catch (error) {
            logger.error('Error processing request:', error);
            const errorResponse: JSONRPCResponse = {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error',
                    data: error instanceof Error ? error.message : 'Unknown error'
                }
            };
            console.log(JSON.stringify(errorResponse));
        }
    });

    // Cleanup on process exit
    process.on('exit', () => {
        stopAuthFlowCleanup();
        rl.close();
    });
}
    updateToolList();
    setInterval(updateToolList, 60000); // Update every minute

    rl.on('line', async (line) => {
        logger.debug(`Received line: ${line}`);
        let jsonRpcRequest: JSONRPCRequest | null = null;
        let requestId: string | number | null = null;

        try {
            jsonRpcRequest = JSON.parse(line);
            requestId = jsonRpcRequest?.id ?? null;

            if (!jsonRpcRequest || typeof jsonRpcRequest !== 'object' || !jsonRpcRequest.method) {
                throw new JSONRPCErrorException("Invalid Request object", -32600); // Invalid Request
            }

            logger.info(`Received RPC request (ID: ${requestId ?? 'N/A'}, Method: ${jsonRpcRequest.method})`);
            const response: JSONRPCResponse | null = await jsonRpcServer.receive(jsonRpcRequest);

            if (response) {
                const responseString = JSON.stringify(response);
                logger.info(`Sending RPC response (ID: ${response.id})`);
                logger.debug(`Response payload: ${responseString}`);
                process.stdout.write(responseString + '\n');
            } else {
                logger.debug(`No response generated for request (potentially a notification): ID ${requestId ?? 'N/A'}`);
            }

        } catch (error: any) { // Catch any error, including parsing and processing
             if (error instanceof SyntaxError) {
                 // Handle JSON parsing errors specifically
                logger.error('Error parsing JSON request:', error);
                const errorResponse = {
                    jsonrpc: "2.0",
                    error: { code: -32700, message: "Parse error" }, // Parse Error code
                    id: null // ID is unknown if parsing failed
                };
                 process.stdout.write(JSON.stringify(errorResponse) + '\n');
             } else if (error instanceof JSONRPCErrorException) {
                // Log and send specific JSON-RPC errors from jsonRpcServer.receive or method handlers
                logger.error(`JSONRPCErrorException during processing (ID: ${requestId ?? 'N/A'}): ${error.message} (Code: ${error.code})`, error.data);
                 const errorResponse = {
                    jsonrpc: "2.0",
                    error: { code: error.code, message: error.message, data: error.data },
                    id: requestId
                };
                process.stdout.write(JSON.stringify(errorResponse) + '\n');
            } else {
                 // Handle unexpected errors during method execution or other issues
                logger.error(`Unexpected error processing RPC request (ID: ${requestId ?? 'N/A'}):`, error);
                 const errorResponse = {
                    jsonrpc: "2.0",
                    error: { code: -32603, message: "Internal server error." }, // Internal Error code
                    id: requestId
                };
                process.stdout.write(JSON.stringify(errorResponse) + '\n');
            }
        }
    });

    rl.on('close', () => {
        logger.info('MCP input stream closed.');
        stopAuthFlowCleanup(); // Stop the cleanup interval
        process.exit(0);
    });

    logger.info('Kick MCP Server handler started and listening on stdin.');
};