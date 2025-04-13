const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const { JSONRPCServer } = require('json-rpc-2.0');
const WebSocket = require('ws');
const NodeCache = require('node-cache');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const helmet = require('helmet');
const prometheus = require('prom-client');
const crypto = require('crypto');
require('dotenv').config();

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

const makeKickRequest = async (endpoint, method = 'GET', data = null, headers = {}) => {
  try {
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data)}:${JSON.stringify(headers)}`;
    
    if (method === 'GET') {
      const cachedData = cache.get(cacheKey);
      if (cachedData) return cachedData;
    }

    const url = `${KICK_API_BASE_URL}${endpoint}`;
    const response = await axios({ method, url, headers, data });
    
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
        return makeKickRequest(`/channels/${params.channel_id}/chat/messages`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    sendChatMessage: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'message']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/messages`, 'POST', {
            message: params.message
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChatSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/settings`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Channel methods
const channelMethods = {
    getChannelInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelFollowers: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/followers`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelSubscribers: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/subscribers`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Stream methods
const streamMethods = {
    getStreamInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamChatters: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/chatters`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Additional User Methods
const additionalUserMethods = {
    getUserClips: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/clips', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserVideos: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/videos', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserHighlights: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/highlights', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserScheduledStreams: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/scheduled-streams', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserNotifications: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/notifications', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserWallet: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/wallet', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserGifts: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/gifts', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserEmotes: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/emotes', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserBadges: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/badges', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserFollows: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/follows', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserBlockedUsers: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/blocked', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserSubscriptions: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/subscriptions', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Additional Channel Methods
const additionalChannelMethods = {
    getChannelClips: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/clips`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelVideos: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/videos`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelHighlights: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/highlights`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelScheduledStreams: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/scheduled-streams`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelChatRules: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/rules`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelChatCommands: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/commands`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelCategories: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/categories`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelTags: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/tags`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelGifts: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/gifts`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelRaids: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/raids`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelHosts: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/hosts`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelEmotes: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/emotes`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelBadges: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/badges`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelModerators: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/moderators`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelBans: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/bans`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelVips: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/vips`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChannelSubscriberBadges: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/subscriber-badges`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    updateChannelInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest(`/channels/${params.channel_id}`, 'PATCH', params.data, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    updateChannelSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest(`/channels/${params.channel_id}/settings`, 'PATCH', params.data, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    updateChannelChatSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/settings`, 'PATCH', params.data, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Additional Stream Methods
const additionalStreamMethods = {
    getStreamViewers: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/viewers`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamCategories: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/categories`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamTags: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/tags`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamStats: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/stats`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamClips: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/clips`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamHighlights: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/highlights`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamMarkers: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/markers`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamPoll: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/poll`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamPredictions: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/predictions`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamRaids: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/raids`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getStreamHosts: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/hosts`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    startStream: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/start`, 'POST', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    endStream: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/end`, 'POST', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    updateStreamInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest(`/channels/${params.channel_id}/stream`, 'PATCH', params.data, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    updateStreamSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/settings`, 'PATCH', params.data, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Chat Management Methods
const chatManagementMethods = {
    banUser: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/ban`, 'POST', {
            user_id: params.user_id
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    unbanUser: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/unban`, 'POST', {
            user_id: params.user_id
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    timeoutUser: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id', 'duration']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/timeout`, 'POST', {
            user_id: params.user_id,
            duration: params.duration
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    deleteMessage: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'message_id']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/messages/${params.message_id}`, 'DELETE', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    clearChat: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/clear`, 'POST', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getChatUserInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest(`/channels/${params.channel_id}/chat/users/${params.user_id}`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Moderation Methods
const moderationMethods = {
    addModerator: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest(`/channels/${params.channel_id}/moderators`, 'POST', {
            user_id: params.user_id
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    removeModerator: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest(`/channels/${params.channel_id}/moderators/${params.user_id}`, 'DELETE', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    addVIP: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest(`/channels/${params.channel_id}/vips`, 'POST', {
            user_id: params.user_id
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    removeVIP: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'user_id']);
        return makeKickRequest(`/channels/${params.channel_id}/vips/${params.user_id}`, 'DELETE', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Stream Interaction Methods
const streamInteractionMethods = {
    createPoll: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'title', 'options', 'duration']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/poll`, 'POST', {
            title: params.title,
            options: params.options,
            duration: params.duration
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    endPoll: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'poll_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/poll/${params.poll_id}/end`, 'POST', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    createPrediction: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'title', 'options', 'duration']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/prediction`, 'POST', {
            title: params.title,
            options: params.options,
            duration: params.duration
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    endPrediction: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'prediction_id', 'winning_outcome_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/prediction/${params.prediction_id}/end`, 'POST', {
            winning_outcome_id: params.winning_outcome_id
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    createMarker: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'description']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/marker`, 'POST', {
            description: params.description
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
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
        const response = await makeKickRequest('/public-key', 'GET');
        return response.public_key;
    }
};

// Event Type Methods
const eventTypeMethods = {
    subscribeToEvents: async (params) => {
        validateParams(params, ['access_token', 'events']);
        return makeKickRequest('/events/subscribe', 'POST', {
            events: params.events
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    unsubscribeFromEvents: async (params) => {
        validateParams(params, ['access_token', 'events']);
        return makeKickRequest('/events/unsubscribe', 'POST', {
            events: params.events
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getEventSubscriptions: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/events/subscriptions', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Livestream Methods
const livestreamMethods = {
    getLivestreams: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/livestreams', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getLivestreamBySlug: async (params) => {
        validateParams(params, ['access_token', 'slug']);
        return makeKickRequest(`/livestreams/${params.slug}`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getLivestreamCategories: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/livestreams/categories', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getLivestreamTags: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/livestreams/tags', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Categories Methods
const categoriesMethods = {
    getCategories: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/categories', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getCategoryBySlug: async (params) => {
        validateParams(params, ['access_token', 'slug']);
        return makeKickRequest(`/categories/${params.slug}`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getCategoryStreams: async (params) => {
        validateParams(params, ['access_token', 'slug']);
        return makeKickRequest(`/categories/${params.slug}/streams`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Additional Webhook Methods
const additionalWebhookMethods = {
    getWebhookPayloads: async (params) => {
        validateParams(params, ['access_token', 'event_type']);
        return makeKickRequest(`/webhooks/payloads/${params.event_type}`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    retryWebhook: async (params) => {
        validateParams(params, ['access_token', 'webhook_id', 'message_id']);
        return makeKickRequest(`/webhooks/${params.webhook_id}/retry`, 'POST', {
            message_id: params.message_id
        }, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getWebhookDeliveryStatus: async (params) => {
        validateParams(params, ['access_token', 'webhook_id']);
        return makeKickRequest(`/webhooks/${params.webhook_id}/deliveries`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getWebhookEvents: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/webhooks/events', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Additional Event Type Methods
const additionalEventTypeMethods = {
    getEventTypes: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/events/types', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getEventTypeSchema: async (params) => {
        validateParams(params, ['access_token', 'event_type']);
        return makeKickRequest(`/events/types/${params.event_type}/schema`, 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Additional Stream Management Methods
const additionalStreamManagementMethods = {
    startStream: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/start`, 'POST', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    endStream: async (params) => {
        validateParams(params, ['access_token', 'channel_id']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/end`, 'POST', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    updateStreamInfo: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest(`/channels/${params.channel_id}/stream`, 'PATCH', params.data, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    updateStreamSettings: async (params) => {
        validateParams(params, ['access_token', 'channel_id', 'data']);
        return makeKickRequest(`/channels/${params.channel_id}/stream/settings`, 'PATCH', params.data, {
            Authorization: `Bearer ${params.access_token}`
        });
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
        return makeKickRequest('/oauth2/token', 'POST', {
            client_id: params.client_id,
            client_secret: params.client_secret,
            code: params.code,
            redirect_uri: params.redirect_uri,
            grant_type: 'authorization_code'
        });
    },
    
    refreshAccessToken: async (params) => {
        validateParams(params, ['client_id', 'client_secret', 'refresh_token']);
        return makeKickRequest('/oauth2/token', 'POST', {
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
        return makeKickRequest('/users/me', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    updateUserProfile: async (params) => {
        validateParams(params, ['access_token', 'data']);
        return makeKickRequest('/users/me', 'PATCH', params.data, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    getUserSubscriptions: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/users/me/subscriptions', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    }
};

// Additional Authentication Methods
const additionalAuthMethods = {
    getAppAccessToken: async (params) => {
        validateParams(params, ['client_id', 'client_secret']);
        return makeKickRequest('/oauth2/token', 'POST', {
            client_id: params.client_id,
            client_secret: params.client_secret,
            grant_type: 'client_credentials'
        });
    },
    
    validateToken: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/oauth2/validate', 'GET', null, {
            Authorization: `Bearer ${params.access_token}`
        });
    },
    
    revokeToken: async (params) => {
        validateParams(params, ['access_token']);
        return makeKickRequest('/oauth2/revoke', 'POST', {
            token: params.access_token
        });
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

// WebSocket server setup
const wss = new WebSocket.Server({ server: httpServer, path: '/ws' });

wss.on('connection', (ws, req) => {
  const sessionId = req.headers['x-session-id'] || Date.now().toString();
  const session = {
    id: sessionId,
    ws,
    lastPing: Date.now(),
    timeout: setTimeout(() => {
      logger.info('Session timeout', { sessionId });
      ws.close();
    }, TIMEOUT)
  };

  sessions.set(sessionId, session);

  // Send session ID to client
  ws.send(JSON.stringify({ type: 'session', sessionId }));

  // Setup ping interval
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
      session.lastPing = Date.now();
    }
  }, PING_INTERVAL);

  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message);
      const response = await server.receive(request);
      ws.send(JSON.stringify(response));
    } catch (error) {
      logger.error('WebSocket message error:', { error: error.message });
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        error: handleError(error)
      }));
    }
  });

  ws.on('close', () => {
    clearInterval(pingInterval);
    clearTimeout(session.timeout);
    sessions.delete(sessionId);
    logger.info('WebSocket connection closed', { sessionId });
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', { error: error.message, sessionId });
  });
});

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

// Enhanced health check
app.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        version: process.env.npm_package_version,
        uptime: process.uptime(),
        sessions: sessions.size,
        redis: {
            status: 'ok',
            connected: redis.status === 'ready'
        },
        memory: {
            total: process.memoryUsage().heapTotal,
            used: process.memoryUsage().heapUsed
        }
    };
    
    try {
        await redis.ping();
    } catch (error) {
        health.redis.status = 'error';
        health.redis.error = error.message;
        health.status = 'error';
    }
    
    res.json(health);
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

// Start server
httpServer.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
