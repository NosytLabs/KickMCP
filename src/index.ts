import { Express, Request, Response, NextFunction } from 'express';
import { WebSocketServer } from 'ws';
import { JSONRPCServer } from 'json-rpc-2.0';
import { Server } from 'http';
import { Cache } from 'node-cache';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createLogger, format, transports } from 'winston';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import axios from 'axios';
import bodyParser from 'body-parser';
import { WebSocket } from 'ws';
import { NodeCache } from 'node-cache';
import { winston } from 'winston';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { prometheus } from 'prom-client';
import { crypto } from 'crypto';

const app = express();
const port = process.env.PORT || 3001;

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Initialize cache with 5 minutes TTL (matching serverless timeout)
const cache = new NodeCache({ stdTTL: 300 });

// Rate limiting configuration
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

// Configure rate limiting
const limiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rate-limit:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Configure caching
const cacheMiddleware = require('express-cache-middleware');
const cacheManager = require('cache-manager');

const cacheMiddlewareInstance = cacheManager.caching({
    store: 'memory',
    max: 100,
    ttl: 60 // seconds
});

cache({ store: cacheMiddlewareInstance });
app.use(cache.middleware);

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Constants
const KICK_API_BASE_URL = process.env.KICK_API_BASE_URL || 'https://kick.com/api/v2';
const DEFAULT_ERROR = { code: -32603, message: 'Internal server error' };
const PING_INTERVAL = 30000; // 30 seconds
const TIMEOUT = 300000; // 5 minutes
const RECONNECT_DELAY = 5000; // 5 seconds

// Initialize JSON-RPC server
const server = new JSONRPCServer();

// Session management
const sessions = new Map();

// Utility functions
const handleError = (error) => {
  logger.error('Kick API Error:', { error: error.message || error });
  return {
    code: error.response?.status || -32603,
    message: error.response?.data?.message || 'Kick API request failed'
  };
};

const validateParams = (params, requiredFields) => {
  for (const field of requiredFields) {
    if (!params[field]) {
      throw { code: -32602, message: `${field} is required` };
    }
  }
};

interface KickRequestParams {
  access_token?: string;
  [key: string]: any;
}

interface KickResponse {
  data?: any;
  error?: {
    code: number;
    message: string;
  };
}

const makeKickRequest = async (
  method: string,
  endpoint: string,
  params: KickRequestParams
): Promise<KickResponse> => {
  try {
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(params)}`;
    
    if (method === 'GET') {
      const cachedData = cache.get(cacheKey);
      if (cachedData) return cachedData;
    }

    const url = `${KICK_API_BASE_URL}${endpoint}`;
    const response = await axios({ method, url, headers: { Authorization: `Bearer ${params.access_token}` }, data: params });
    
    if (method === 'GET') {
      cache.set(cacheKey, response.data);
    }
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

// Chat methods
const chatMethods = {
    getChatMessages: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/chat/messages`, params);
    },
    
    sendChatMessage: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'message']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/chat/messages`, params);
    },
    
    getChatSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/chat/settings`, params);
    }
};

// Channel methods
const channelMethods = {
    getChannelInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}`, params);
    },
    
    getChannelFollowers: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/followers`, params);
    },
    
    getChannelSubscribers: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/subscribers`, params);
    }
};

// Stream methods
const streamMethods = {
    getStreamInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream`, params);
    },
    
    getStreamChatters: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/chatters`, params);
    }
};

// Additional User Methods
const additionalUserMethods = {
    getUserClips: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/clips', params);
    },
    
    getUserVideos: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/videos', params);
    },
    
    getUserHighlights: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/highlights', params);
    },
    
    getUserScheduledStreams: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/scheduled-streams', params);
    },
    
    getUserNotifications: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/notifications', params);
    },
    
    getUserWallet: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/wallet', params);
    },
    
    getUserGifts: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/gifts', params);
    },
    
    getUserEmotes: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/emotes', params);
    },
    
    getUserBadges: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/badges', params);
    },
    
    getUserFollows: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/follows', params);
    },
    
    getUserBlockedUsers: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/blocked', params);
    },
    
    getUserSubscriptions: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/subscriptions', params);
    }
};

// Additional Channel Methods
const additionalChannelMethods = {
    getChannelClips: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/clips`, params);
    },
    
    getChannelVideos: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/videos`, params);
    },
    
    getChannelHighlights: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/highlights`, params);
    },
    
    getChannelScheduledStreams: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/scheduled-streams`, params);
    },
    
    getChannelChatRules: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/chat/rules`, params);
    },
    
    getChannelChatCommands: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/chat/commands`, params);
    },
    
    getChannelCategories: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/categories`, params);
    },
    
    getChannelTags: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/tags`, params);
    },
    
    getChannelGifts: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/gifts`, params);
    },
    
    getChannelRaids: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/raids`, params);
    },
    
    getChannelHosts: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/hosts`, params);
    },
    
    getChannelEmotes: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/emotes`, params);
    },
    
    getChannelBadges: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/badges`, params);
    },
    
    getChannelModerators: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/moderators`, params);
    },
    
    getChannelBans: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/bans`, params);
    },
    
    getChannelVips: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/vips`, params);
    },
    
    getChannelSubscriberBadges: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/subscriber-badges`, params);
    },
    
    updateChannelInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest('PATCH', `/channels/${params.channel_id}`, params);
    },
    
    updateChannelSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest('PATCH', `/channels/${params.channel_id}/settings`, params);
    },
    
    updateChannelChatSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest('PATCH', `/channels/${params.channel_id}/chat/settings`, params);
    }
};

// Additional Stream Methods
const additionalStreamMethods = {
    getStreamViewers: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/viewers`, params);
    },
    
    getStreamCategories: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/categories`, params);
    },
    
    getStreamTags: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/tags`, params);
    },
    
    getStreamStats: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/stats`, params);
    },
    
    getStreamClips: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/clips`, params);
    },
    
    getStreamHighlights: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/highlights`, params);
    },
    
    getStreamMarkers: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/markers`, params);
    },
    
    getStreamPoll: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/poll`, params);
    },
    
    getStreamPredictions: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/predictions`, params);
    },
    
    getStreamRaids: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/raids`, params);
    },
    
    getStreamHosts: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/stream/hosts`, params);
    },
    
    startStream: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/start`, params);
    },
    
    endStream: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/end`, params);
    },
    
    updateStreamInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest('PATCH', `/channels/${params.channel_id}/stream`, params);
    },
    
    updateStreamSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest('PATCH', `/channels/${params.channel_id}/stream/settings`, params);
    }
};

// Chat Management Methods
const chatManagementMethods = {
    banUser: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/chat/ban`, params);
    },
    
    unbanUser: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/chat/unban`, params);
    },
    
    timeoutUser: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id', 'duration']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/chat/timeout`, params);
    },
    
    deleteMessage: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'message_id']);
        return makeKickRequest('DELETE', `/channels/${params.channel_id}/chat/messages/${params.message_id}`, params);
    },
    
    clearChat: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/chat/clear`, params);
    },
    
    getChatUserInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest('GET', `/channels/${params.channel_id}/chat/users/${params.user_id}`, params);
    }
};

// Moderation Methods
const moderationMethods = {
    addModerator: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/moderators`, params);
    },
    
    removeModerator: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest('DELETE', `/channels/${params.channel_id}/moderators/${params.user_id}`, params);
    },
    
    addVIP: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/vips`, params);
    },
    
    removeVIP: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest('DELETE', `/channels/${params.channel_id}/vips/${params.user_id}`, params);
    }
};

// Stream Interaction Methods
const streamInteractionMethods = {
    createPoll: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'title', 'options', 'duration']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/poll`, params);
    },
    
    endPoll: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'poll_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/poll/${params.poll_id}/end`, params);
    },
    
    createPrediction: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'title', 'options', 'duration']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/prediction`, params);
    },
    
    endPrediction: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'prediction_id', 'winning_outcome_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/prediction/${params.prediction_id}/end`, params);
    },
    
    createMarker: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'description']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/marker`, params);
    }
};

// Webhook Security Methods
const webhookSecurityMethods = {
    verifyWebhookSignature: async (params) => {
        validateParams(params, ['signature', 'message_id', 'timestamp', 'body']);
        const publicKey = await getPublicKey();
        
        const signature = Buffer.from(params.signature, 'base64');
        const message = `${params.message_id}.${params.timestamp}.${params.body}`;
        const hash = crypto.createHash('sha256').update(message).digest();
        
        return crypto.verify(
            'sha256',
            hash,
            publicKey,
            signature
        );
    },
    
    getPublicKey: async () => {
        const response = await makeKickRequest('GET', '/public-key', {});
        return response.public_key;
    }
};

// Event Type Methods
const eventTypeMethods = {
    subscribeToEvents: async (params) => {
        validateParams(params, ['access_token', 'events']);
        return makeKickRequest('POST', '/events/subscribe', params);
    },
    
    unsubscribeFromEvents: async (params) => {
        validateParams(params, ['access_token', 'events']);
        return makeKickRequest('POST', '/events/unsubscribe', params);
    },
    
    getEventSubscriptions: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/events/subscriptions', params);
    }
};

// Livestream Methods
const livestreamMethods = {
    getLivestreams: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/livestreams', params);
    },
    
    getLivestreamBySlug: async (params) => {
        validateParams(params, ['access_token', 'slug']);
        return makeKickRequest('GET', `/livestreams/${params.slug}`, params);
    },
    
    getLivestreamCategories: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/livestreams/categories', params);
    },
    
    getLivestreamTags: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/livestreams/tags', params);
    }
};

// Categories Methods
const categoriesMethods = {
    getCategories: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/categories', params);
    },
    
    getCategoryBySlug: async (params) => {
        validateParams(params, ['access_token', 'slug']);
        return makeKickRequest('GET', `/categories/${params.slug}`, params);
    },
    
    getCategoryStreams: async (params) => {
        validateParams(params, ['access_token', 'slug']);
        return makeKickRequest('GET', `/categories/${params.slug}/streams`, params);
    }
};

// Additional Webhook Methods
const additionalWebhookMethods = {
    getWebhookPayloads: async (params) => {
        validateParams(params, ['access_token', 'event_type']);
        return makeKickRequest('GET', `/webhooks/payloads/${params.event_type}`, params);
    },
    
    retryWebhook: async (params) => {
        validateParams(params, ['access_token', 'webhook_id', 'message_id']);
        return makeKickRequest('POST', `/webhooks/${params.webhook_id}/retry`, params);
    },
    
    getWebhookDeliveryStatus: async (params) => {
        validateParams(params, ['access_token', 'webhook_id']);
        return makeKickRequest('GET', `/webhooks/${params.webhook_id}/deliveries`, params);
    },
    
    getWebhookEvents: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/webhooks/events', params);
    }
};

// Additional Event Type Methods
const additionalEventTypeMethods = {
    getEventTypes: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/events/types', params);
    },
    
    getEventTypeSchema: async (params) => {
        validateParams(params, ['access_token', 'event_type']);
        return makeKickRequest('GET', `/events/types/${params.event_type}/schema`, params);
    }
};

// Additional Stream Management Methods
const additionalStreamManagementMethods = {
    startStream: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/start`, params);
    },
    
    endStream: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest('POST', `/channels/${params.channel_id}/stream/end`, params);
    },
    
    updateStreamInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest('PATCH', `/channels/${params.channel_id}/stream`, params);
    },
    
    updateStreamSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest('PATCH', `/channels/${params.channel_id}/stream/settings`, params);
    }
};

// Update tool metadata
const toolMetadata = {
    oauth: {
        getOAuthUrl: {
            description: 'Get OAuth authorization URL',
            params: ['client_id', 'redirect_uri', 'scope']
        },
        getAccessToken: {
            description: 'Get access token using authorization code',
            params: ['client_id', 'client_secret', 'code', 'redirect_uri']
        },
        refreshAccessToken: {
            description: 'Refresh access token using refresh token',
            params: ['client_id', 'client_secret', 'refresh_token']
        }
    },
    user: {
        getUserProfile: {
            description: 'Get user profile information',
            params: ['access_token']
        },
        updateUserProfile: {
            description: 'Update user profile information',
            params: ['access_token', 'data']
        },
        getUserSubscriptions: {
            description: 'Get user subscriptions',
            params: ['access_token']
        },
        getUserClips: {
            description: 'Get user clips',
            params: ['access_token']
        },
        getUserVideos: {
            description: 'Get user videos',
            params: ['access_token']
        },
        getUserHighlights: {
            description: 'Get user highlights',
            params: ['access_token']
        },
        getUserScheduledStreams: {
            description: 'Get user scheduled streams',
            params: ['access_token']
        },
        getUserNotifications: {
            description: 'Get user notifications',
            params: ['access_token']
        },
        getUserWallet: {
            description: 'Get user wallet information',
            params: ['access_token']
        },
        getUserGifts: {
            description: 'Get user gift history',
            params: ['access_token']
        },
        getUserEmotes: {
            description: 'Get user custom emotes',
            params: ['access_token']
        },
        getUserBadges: {
            description: 'Get user badges',
            params: ['access_token']
        },
        getUserFollows: {
            description: 'Get channels user follows',
            params: ['access_token']
        },
        getUserBlockedUsers: {
            description: 'Get user blocked users list',
            params: ['access_token']
        },
        getUserSubscriptions: {
            description: 'Get user channel subscriptions',
            params: ['access_token']
        }
    },
    chat: {
        getChatMessages: {
            description: 'Get chat messages for a channel',
            params: ['access_token', 'channel_id']
        },
        sendChatMessage: {
            description: 'Send a message to a channel chat',
            params: ['access_token', 'channel_id', 'message']
        },
        getChatSettings: {
            description: 'Get chat settings for a channel',
            params: ['access_token', 'channel_id']
        },
        banUser: {
            description: 'Ban a user from chat',
            params: ['access_token', 'channel_id', 'user_id']
        },
        unbanUser: {
            description: 'Unban a user from chat',
            params: ['access_token', 'channel_id', 'user_id']
        },
        timeoutUser: {
            description: 'Timeout a user from chat',
            params: ['access_token', 'channel_id', 'user_id', 'duration']
        },
        deleteMessage: {
            description: 'Delete a chat message',
            params: ['access_token', 'channel_id', 'message_id']
        },
        clearChat: {
            description: 'Clear the chat',
            params: ['access_token', 'channel_id']
        },
        getChatUserInfo: {
            description: 'Get information about a chat user',
            params: ['access_token', 'channel_id', 'user_id']
        }
    },
    channel: {
        getChannelInfo: {
            description: 'Get channel information',
            params: ['access_token', 'channel_id']
        },
        getChannelFollowers: {
            description: 'Get channel followers',
            params: ['access_token', 'channel_id']
        },
        getChannelSubscribers: {
            description: 'Get channel subscribers',
            params: ['access_token', 'channel_id']
        },
        getChannelEmotes: {
            description: 'Get channel custom emotes',
            params: ['access_token', 'channel_id']
        },
        getChannelBadges: {
            description: 'Get channel badges',
            params: ['access_token', 'channel_id']
        },
        getChannelModerators: {
            description: 'Get channel moderators',
            params: ['access_token', 'channel_id']
        },
        getChannelBans: {
            description: 'Get channel bans',
            params: ['access_token', 'channel_id']
        },
        getChannelVips: {
            description: 'Get channel VIPs',
            params: ['access_token', 'channel_id']
        },
        getChannelSubscriberBadges: {
            description: 'Get channel subscriber badges',
            params: ['access_token', 'channel_id']
        },
        getChannelClips: {
            description: 'Get channel clips',
            params: ['access_token', 'channel_id']
        },
        getChannelVideos: {
            description: 'Get channel videos',
            params: ['access_token', 'channel_id']
        },
        getChannelHighlights: {
            description: 'Get channel highlights',
            params: ['access_token', 'channel_id']
        },
        getChannelScheduledStreams: {
            description: 'Get channel scheduled streams',
            params: ['access_token', 'channel_id']
        },
        getChannelChatRules: {
            description: 'Get channel chat rules',
            params: ['access_token', 'channel_id']
        },
        getChannelChatCommands: {
            description: 'Get channel chat commands',
            params: ['access_token', 'channel_id']
        },
        getChannelCategories: {
            description: 'Get channel categories',
            params: ['access_token', 'channel_id']
        },
        getChannelTags: {
            description: 'Get channel tags',
            params: ['access_token', 'channel_id']
        },
        getChannelGifts: {
            description: 'Get channel gift history',
            params: ['access_token', 'channel_id']
        },
        getChannelRaids: {
            description: 'Get channel raid history',
            params: ['access_token', 'channel_id']
        },
        getChannelHosts: {
            description: 'Get channel host history',
            params: ['access_token', 'channel_id']
        },
        updateChannelInfo: {
            description: 'Update channel information',
            params: ['access_token', 'channel_id', 'data']
        },
        updateChannelSettings: {
            description: 'Update channel settings',
            params: ['access_token', 'channel_id', 'data']
        },
        updateChannelChatSettings: {
            description: 'Update channel chat settings',
            params: ['access_token', 'channel_id', 'data']
        }
    },
    stream: {
        getStreamInfo: {
            description: 'Get stream information',
            params: ['access_token', 'channel_id']
        },
        getStreamChatters: {
            description: 'Get stream chatters',
            params: ['access_token', 'channel_id']
        },
        getStreamViewers: {
            description: 'Get current stream viewers',
            params: ['access_token', 'channel_id']
        },
        getStreamCategories: {
            description: 'Get stream categories',
            params: ['access_token', 'channel_id']
        },
        getStreamTags: {
            description: 'Get stream tags',
            params: ['access_token', 'channel_id']
        },
        getStreamStats: {
            description: 'Get stream statistics',
            params: ['access_token', 'channel_id']
        },
        getStreamClips: {
            description: 'Get stream clips',
            params: ['access_token', 'channel_id']
        },
        getStreamHighlights: {
            description: 'Get stream highlights',
            params: ['access_token', 'channel_id']
        },
        getStreamMarkers: {
            description: 'Get stream markers',
            params: ['access_token', 'channel_id']
        },
        getStreamPoll: {
            description: 'Get stream poll',
            params: ['access_token', 'channel_id']
        },
        getStreamPredictions: {
            description: 'Get stream predictions',
            params: ['access_token', 'channel_id']
        },
        getStreamRaids: {
            description: 'Get stream raid information',
            params: ['access_token', 'channel_id']
        },
        getStreamHosts: {
            description: 'Get stream host information',
            params: ['access_token', 'channel_id']
        },
        startStream: {
            description: 'Start a stream',
            params: ['access_token', 'channel_id']
        },
        endStream: {
            description: 'End a stream',
            params: ['access_token', 'channel_id']
        },
        updateStreamInfo: {
            description: 'Update stream information',
            params: ['access_token', 'channel_id', 'data']
        },
        updateStreamSettings: {
            description: 'Update stream settings',
            params: ['access_token', 'channel_id', 'data']
        },
        createPoll: {
            description: 'Create a stream poll',
            params: ['access_token', 'channel_id', 'title', 'options', 'duration']
        },
        endPoll: {
            description: 'End a stream poll',
            params: ['access_token', 'channel_id', 'poll_id']
        },
        createPrediction: {
            description: 'Create a stream prediction',
            params: ['access_token', 'channel_id', 'title', 'options', 'duration']
        },
        endPrediction: {
            description: 'End a stream prediction',
            params: ['access_token', 'channel_id', 'prediction_id', 'winning_outcome_id']
        },
        createMarker: {
            description: 'Create a stream marker',
            params: ['access_token', 'channel_id', 'description']
        }
    },
    webhook: {
        createWebhook: {
            description: 'Create a webhook subscription',
            params: ['access_token', 'url', 'events']
        },
        deleteWebhook: {
            description: 'Delete a webhook subscription',
            params: ['access_token', 'webhook_id']
        },
        listWebhooks: {
            description: 'List all webhook subscriptions',
            params: ['access_token']
        },
        getWebhookEvents: {
            description: 'Get available webhook events',
            params: ['access_token']
        },
        verifyWebhookSignature: {
            description: 'Verify webhook signature using Kick public key',
            params: ['signature', 'message_id', 'timestamp', 'body']
        },
        getPublicKey: {
            description: 'Get Kick public key for webhook verification',
            params: []
        },
        getWebhookPayloads: {
            description: 'Get example payloads for webhook events',
            params: ['access_token', 'event_type']
        },
        retryWebhook: {
            description: 'Retry a failed webhook delivery',
            params: ['access_token', 'webhook_id', 'message_id']
        },
        getWebhookDeliveryStatus: {
            description: 'Get status of webhook deliveries',
            params: ['access_token', 'webhook_id']
        }
    },
    channelManagement: {
        updateChannelInfo: {
            description: 'Update channel information',
            params: ['access_token', 'channel_id', 'data']
        },
        updateChannelSettings: {
            description: 'Update channel settings',
            params: ['access_token', 'channel_id', 'data']
        },
        updateChannelChatSettings: {
            description: 'Update channel chat settings',
            params: ['access_token', 'channel_id', 'data']
        }
    },
    streamManagement: {
        startStream: {
            description: 'Start a stream',
            params: ['access_token', 'channel_id']
        },
        endStream: {
            description: 'End a stream',
            params: ['access_token', 'channel_id']
        },
        updateStreamInfo: {
            description: 'Update stream information',
            params: ['access_token', 'channel_id', 'data']
        },
        updateStreamSettings: {
            description: 'Update stream settings',
            params: ['access_token', 'channel_id', 'data']
        }
    },
    chat: {
        banUser: {
            description: 'Ban a user from chat',
            params: ['access_token', 'channel_id', 'user_id']
        },
        unbanUser: {
            description: 'Unban a user from chat',
            params: ['access_token', 'channel_id', 'user_id']
        },
        timeoutUser: {
            description: 'Timeout a user from chat',
            params: ['access_token', 'channel_id', 'user_id', 'duration']
        },
        deleteMessage: {
            description: 'Delete a chat message',
            params: ['access_token', 'channel_id', 'message_id']
        },
        clearChat: {
            description: 'Clear the chat',
            params: ['access_token', 'channel_id']
        },
        getChatUserInfo: {
            description: 'Get information about a chat user',
            params: ['access_token', 'channel_id', 'user_id']
        }
    },
    moderation: {
        addModerator: {
            description: 'Add a moderator to the channel',
            params: ['access_token', 'channel_id', 'user_id']
        },
        removeModerator: {
            description: 'Remove a moderator from the channel',
            params: ['access_token', 'channel_id', 'user_id']
        },
        addVIP: {
            description: 'Add a VIP to the channel',
            params: ['access_token', 'channel_id', 'user_id']
        },
        removeVIP: {
            description: 'Remove a VIP from the channel',
            params: ['access_token', 'channel_id', 'user_id']
        }
    },
    stream: {
        createPoll: {
            description: 'Create a stream poll',
            params: ['access_token', 'channel_id', 'title', 'options', 'duration']
        },
        endPoll: {
            description: 'End a stream poll',
            params: ['access_token', 'channel_id', 'poll_id']
        },
        createPrediction: {
            description: 'Create a stream prediction',
            params: ['access_token', 'channel_id', 'title', 'options', 'duration']
        },
        endPrediction: {
            description: 'End a stream prediction',
            params: ['access_token', 'channel_id', 'prediction_id', 'winning_outcome_id']
        },
        createMarker: {
            description: 'Create a stream marker',
            params: ['access_token', 'channel_id', 'description']
        }
    },
    events: {
        subscribeToEvents: {
            description: 'Subscribe to specific event types',
            params: ['access_token', 'events']
        },
        unsubscribeFromEvents: {
            description: 'Unsubscribe from specific event types',
            params: ['access_token', 'events']
        },
        getEventSubscriptions: {
            description: 'Get current event subscriptions',
            params: ['access_token']
        },
        getEventTypes: {
            description: 'Get all available event types',
            params: ['access_token']
        },
        getEventTypeSchema: {
            description: 'Get schema for a specific event type',
            params: ['access_token', 'event_type']
        }
    },
    livestream: {
        getLivestreams: {
            description: 'Get all active livestreams',
            params: ['access_token']
        },
        getLivestreamBySlug: {
            description: 'Get livestream by channel slug',
            params: ['access_token', 'slug']
        },
        getLivestreamCategories: {
            description: 'Get available livestream categories',
            params: ['access_token']
        },
        getLivestreamTags: {
            description: 'Get available livestream tags',
            params: ['access_token']
        }
    },
    categories: {
        getCategories: {
            description: 'Get all available categories',
            params: ['access_token']
        },
        getCategoryBySlug: {
            description: 'Get category by slug',
            params: ['access_token', 'slug']
        },
        getCategoryStreams: {
            description: 'Get streams in a category',
            params: ['access_token', 'slug']
        }
    }
};

// OAuth methods with lazy authentication
const oauthMethods = {
    getOAuthUrl: async (params) => {
        validateParams(params, ['client_id', 'redirect_uri', 'scope']);
        const scope = Array.isArray(params.scope) ? params.scope.join(' ') : params.scope;
        return `${KICK_API_BASE_URL}/oauth2/authorize?client_id=${params.client_id}&redirect_uri=${params.redirect_uri}&scope=${scope}&response_type=code`;
    },
    
    getAccessToken: async (params) => {
        validateParams(params, ['client_id', 'client_secret', 'code', 'redirect_uri']);
        return makeKickRequest('POST', '/oauth2/token', {
            client_id: params.client_id,
            client_secret: params.client_secret,
            code: params.code,
            redirect_uri: params.redirect_uri,
            grant_type: 'authorization_code'
        });
    },
    
    refreshAccessToken: async (params) => {
        validateParams(params, ['client_id', 'client_secret', 'refresh_token']);
        return makeKickRequest('POST', '/oauth2/token', {
            client_id: params.client_id,
            client_secret: params.client_secret,
            refresh_token: params.refresh_token,
            grant_type: 'refresh_token'
        });
    }
};

// User methods with lazy authentication
const userMethods = {
    getUserProfile: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me', null, { Authorization: `Bearer ${params.access_token}` });
    },
    
    updateUserProfile: async (params) => {
        validateParams(params, ['access_token', 'data']);
        return makeKickRequest('PATCH', '/users/me', params, { Authorization: `Bearer ${params.access_token}` });
    },
    
    getUserSubscriptions: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/users/me/subscriptions', null, { Authorization: `Bearer ${params.access_token}` });
    }
};

// Additional Authentication Methods
const additionalAuthMethods = {
    getAppAccessToken: async (params) => {
        validateParams(params, ['client_id', 'client_secret']);
        return makeKickRequest('POST', '/oauth2/token', {
            client_id: params.client_id,
            client_secret: params.client_secret,
            grant_type: 'client_credentials'
        });
    },
    
    validateToken: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('GET', '/oauth2/validate', null, { Authorization: `Bearer ${params.access_token}` });
    },
    
    revokeToken: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('POST', '/oauth2/revoke', { token: params.access_token });
    }
};

// Register all methods with the JSON-RPC server
const allMethods = {
    ...oauthMethods,
    ...userMethods,
    ...chatMethods,
    ...channelMethods,
    ...streamMethods,
    ...additionalUserMethods,
    ...moderationMethods,
    ...streamInteractionMethods,
    ...webhookSecurityMethods,
    ...eventTypeMethods,
    ...livestreamMethods,
    ...categoriesMethods,
    ...additionalWebhookMethods,
    ...additionalEventTypeMethods,
    ...additionalStreamManagementMethods,
    ...additionalAuthMethods,
    ...additionalChannelMethods,
    ...additionalStreamMethods
};

Object.entries(allMethods).forEach(([name, method]) => {
    server.addMethod(name, method);
});

// Create HTTP server
const httpServer = require('http').createServer(app);

// WebSocket configuration
const wsConfig = {
  enabled: process.env.WEBSOCKET_ENABLED === 'true',
  pingInterval: parseInt(process.env.WEBSOCKET_PING_INTERVAL || '30000', 10),
  pingTimeout: parseInt(process.env.WEBSOCKET_PING_TIMEOUT || '5000', 10)
};

// Error handling configuration
const errorConfig = {
  showStack: process.env.ERROR_SHOW_STACK === 'true',
  logErrors: process.env.ERROR_LOG_ERRORS === 'true'
};

// Error handling middleware
interface AppError extends Error {
  status?: number;
  code?: string;
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error
  console.error(`[${new Date().toISOString()}] Error: ${message}`, {
    status,
    code: err.code,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Send error response
  res.status(status).json({
    error: {
      message,
      code: err.code,
      status,
      timestamp: new Date().toISOString()
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// WebSocket server setup
if (wsConfig.enabled) {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws: WebSocket) => {
    logger.info('New WebSocket connection');
    
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, wsConfig.pingInterval);
    
    ws.on('pong', () => {
      logger.debug('Received pong');
    });
    
    ws.on('close', () => {
      logger.info('WebSocket connection closed');
      clearInterval(pingInterval);
    });
    
    ws.on('error', (error: Error) => {
      logger.error('WebSocket error:', error);
    });
  });
}

// IP whitelist middleware
const ipWhitelist = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];
app.use((req, res, next) => {
    if (ipWhitelist.length > 0 && !ipWhitelist.includes(req.ip)) {
        return res.status(403).json({ error: 'IP not whitelisted' });
    }
    next();
});

// Request signing middleware
app.use((req, res, next) => {
    if (process.env.REQUIRE_SIGNATURE === 'true') {
        const signature = req.headers['x-signature'];
        if (!signature) {
            return res.status(401).json({ error: 'Missing signature' });
        }
        
        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', process.env.SIGNATURE_SECRET)
            .update(payload)
            .digest('hex');
            
        if (signature !== expectedSignature) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
    }
    next();
});

// Monitoring and metrics
const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestDurationMicroseconds = new prometheus.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 5, 15, 50, 100, 500]
});

// Metrics middleware
app.use((req, res, next) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
        const duration = process.hrtime(start);
        const durationMs = duration[0] * 1000 + duration[1] / 1000000;
        
        httpRequestDurationMicroseconds
            .labels(req.method, req.route?.path || req.path, res.statusCode)
            .observe(durationMs);
    });
    
    next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', prometheus.register.contentType);
        res.end(await prometheus.register.metrics());
    } catch (error) {
        res.status(500).end(error);
    }
});

// Enhanced health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external
    },
    cpu: {
      usage: process.cpuUsage()
    },
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  };

  res.json(healthInfo);
});

// Public endpoints middleware
const publicEndpoints = process.env.PUBLIC_ENDPOINTS?.split(',') || ['/tools/list', '/initialize'];
app.use((req: Request, res: Response, next: NextFunction) => {
  if (publicEndpoints.includes(req.path)) {
    return next();
  }
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Tools endpoint (no authentication required)
app.get('/tools', (req, res) => {
  res.json({
    tools: Object.keys(server.methods).map(name => ({
      name,
      description: toolMetadata[name]?.description || '',
      params: toolMetadata[name]?.params || []
    }))
  });
});

// Configuration validation middleware
const validateConfig = (req: Request, res: Response, next: NextFunction) => {
  const requiredConfig = [
    'KICK_API_KEY',
    'PORT',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX'
  ];

  const missingConfig = requiredConfig.filter(key => !process.env[key]);
  
  if (missingConfig.length > 0) {
    logger.error('Missing required configuration', { missingConfig });
    return res.status(500).json({
      error: 'Server configuration error',
      message: `Missing required configuration: ${missingConfig.join(', ')}`
    });
  }

  next();
};

// Apply configuration validation
app.use(validateConfig);

// Start server
httpServer.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
