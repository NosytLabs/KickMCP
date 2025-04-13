import { JSONRPCServer, JSONRPCRequest, JSONRPCResponse } from 'json-rpc-2.0';
import * as readline from 'readline';
import { logger } from '../utils/logger';
import { KickService } from '../services/kick';

// Define tool schemas
const toolSchemas = [
  // Authentication Methods
  {
    name: 'getOAuthUrl',
    description: 'Get OAuth authorization URL',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'Client ID'
        },
        redirect_uri: {
          type: 'string',
          description: 'Redirect URI'
        },
        scope: {
          type: 'string',
          description: 'Scope (e.g., user:read channel:read chat:write)'
        },
        state: {
          type: 'string',
          description: 'Random string to maintain state between request and callback'
        },
        code_challenge: {
          type: 'string',
          description: 'PKCE code challenge'
        },
        code_challenge_method: {
          type: 'string',
          description: 'Code challenge method (S256 recommended)'
        }
      },
      required: ['client_id', 'redirect_uri', 'scope']
    }
  },
  {
    name: 'getAccessToken',
    description: 'Exchange code for token',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'Client ID'
        },
        client_secret: {
          type: 'string',
          description: 'Client Secret'
        },
        code: {
          type: 'string',
          description: 'Authorization code'
        },
        redirect_uri: {
          type: 'string',
          description: 'Redirect URI (must match the one used in authorization)'
        },
        code_verifier: {
          type: 'string',
          description: 'PKCE code verifier to validate the code challenge'
        }
      },
      required: ['client_id', 'client_secret', 'code', 'redirect_uri']
    }
  },
  {
    name: 'refreshAccessToken',
    description: 'Refresh expired token',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'Client ID'
        },
        client_secret: {
          type: 'string',
          description: 'Client Secret'
        },
        refresh_token: {
          type: 'string',
          description: 'Refresh token'
        }
      },
      required: ['client_id', 'client_secret', 'refresh_token']
    }
  },
  {
    name: 'validateToken',
    description: 'Validate access token',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'revokeToken',
    description: 'Revoke access token',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  
  // User Methods
  {
    name: 'getUserProfile',
    description: 'Get user profile',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'updateUserProfile',
    description: 'Update user profile',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        data: {
          type: 'object',
          description: 'Profile data to update'
        }
      },
      required: ['access_token', 'data']
    }
  },
  {
    name: 'getUserSubscriptions',
    description: 'Get user subscriptions',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserEmotes',
    description: 'Get user emotes',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserBadges',
    description: 'Get user badges',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserFollows',
    description: 'Get followed channels',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserBlockedUsers',
    description: 'Get blocked users',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserClips',
    description: 'Get user clips',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserVideos',
    description: 'Get user videos',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserHighlights',
    description: 'Get user highlights',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserScheduledStreams',
    description: 'Get scheduled streams',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserNotifications',
    description: 'Get notifications',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserWallet',
    description: 'Get wallet info',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getUserGifts',
    description: 'Get gift history',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  
  // Chat Methods
  {
    name: 'getChatMessages',
    description: 'Get chat messages',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'sendChatMessage',
    description: 'Send chat message',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        message: {
          type: 'string',
          description: 'Message text'
        }
      },
      required: ['access_token', 'channel_id', 'message']
    }
  },
  {
    name: 'getChatSettings',
    description: 'Get chat settings',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'banUser',
    description: 'Ban user from chat',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        user_id: {
          type: 'string',
          description: 'User ID to ban'
        }
      },
      required: ['access_token', 'channel_id', 'user_id']
    }
  },
  {
    name: 'unbanUser',
    description: 'Unban user from chat',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        user_id: {
          type: 'string',
          description: 'User ID to unban'
        }
      },
      required: ['access_token', 'channel_id', 'user_id']
    }
  },
  {
    name: 'timeoutUser',
    description: 'Timeout user',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        user_id: {
          type: 'string',
          description: 'User ID to timeout'
        },
        duration: {
          type: 'integer',
          description: 'Timeout duration in seconds'
        }
      },
      required: ['access_token', 'channel_id', 'user_id', 'duration']
    }
  },
  {
    name: 'deleteMessage',
    description: 'Delete chat message',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        message_id: {
          type: 'string',
          description: 'Message ID to delete'
        }
      },
      required: ['access_token', 'channel_id', 'message_id']
    }
  },
  {
    name: 'clearChat',
    description: 'Clear all chat messages',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChatUserInfo',
    description: 'Get chat user info',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        user_id: {
          type: 'string',
          description: 'User ID'
        }
      },
      required: ['access_token', 'channel_id', 'user_id']
    }
  },
  
  // Channel Methods
  {
    name: 'getChannelInfo',
    description: 'Get channel information',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['channel_id']
    }
  },
  {
    name: 'getChannelFollowers',
    description: 'Get channel followers',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelSubscribers',
    description: 'Get channel subscribers',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelEmotes',
    description: 'Get channel emotes',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelBadges',
    description: 'Get channel badges',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelModerators',
    description: 'Get channel moderators',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelBans',
    description: 'Get channel banned users',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelVips',
    description: 'Get channel VIP users',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelClips',
    description: 'Get channel clips',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelVideos',
    description: 'Get channel videos',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelHighlights',
    description: 'Get channel highlights',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelScheduledStreams',
    description: 'Get channel scheduled streams',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelChatRules',
    description: 'Get channel chat rules',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelChatCommands',
    description: 'Get channel chat commands',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelCategories',
    description: 'Get channel categories',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelTags',
    description: 'Get channel tags',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelGifts',
    description: 'Get channel gift history',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelRaids',
    description: 'Get channel raid history',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getChannelHosts',
    description: 'Get channel host history',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  
  // Stream Methods
  {
    name: 'getLivestreams',
    description: 'Get list of current livestreams',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getLivestreamBySlug',
    description: 'Get livestream by slug',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Stream slug'
        }
      },
      required: ['slug']
    }
  },
  {
    name: 'startStream',
    description: 'Start streaming',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'endStream',
    description: 'End stream',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'updateStreamInfo',
    description: 'Update stream info',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        data: {
          type: 'object',
          description: 'Stream info data'
        }
      },
      required: ['access_token', 'channel_id', 'data']
    }
  },
  {
    name: 'updateStreamSettings',
    description: 'Update stream settings',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        data: {
          type: 'object',
          description: 'Stream settings data'
        }
      },
      required: ['access_token', 'channel_id', 'data']
    }
  },
  {
    name: 'getStreamInfo',
    description: 'Get stream information',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getStreamViewers',
    description: 'Get stream viewers',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getStreamCategories',
    description: 'Get stream categories',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getStreamTags',
    description: 'Get stream tags',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'getStreamStats',
    description: 'Get stream statistics',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  {
    name: 'createPoll',
    description: 'Create poll',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        title: {
          type: 'string',
          description: 'Poll title'
        },
        options: {
          type: 'array',
          description: 'Poll options',
          items: {
            type: 'string'
          }
        },
        duration: {
          type: 'integer',
          description: 'Poll duration in seconds'
        }
      },
      required: ['access_token', 'channel_id', 'title', 'options', 'duration']
    }
  },
  {
    name: 'endPoll',
    description: 'End active poll',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        poll_id: {
          type: 'string',
          description: 'Poll ID'
        }
      },
      required: ['access_token', 'channel_id', 'poll_id']
    }
  },
  {
    name: 'createPrediction',
    description: 'Create prediction',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        title: {
          type: 'string',
          description: 'Prediction title'
        },
        options: {
          type: 'array',
          description: 'Prediction outcomes',
          items: {
            type: 'string'
          }
        },
        duration: {
          type: 'integer',
          description: 'Prediction duration in seconds'
        }
      },
      required: ['access_token', 'channel_id', 'title', 'options', 'duration']
    }
  },
  {
    name: 'endPrediction',
    description: 'End prediction',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        prediction_id: {
          type: 'string',
          description: 'Prediction ID'
        },
        winning_outcome_id: {
          type: 'string',
          description: 'Winning outcome ID'
        }
      },
      required: ['access_token', 'channel_id', 'prediction_id', 'winning_outcome_id']
    }
  },
  {
    name: 'createMarker',
    description: 'Create stream marker',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        description: {
          type: 'string',
          description: 'Marker description'
        }
      },
      required: ['access_token', 'channel_id', 'description']
    }
  },
  
  // Webhook Methods
  {
    name: 'createWebhook',
    description: 'Create webhook',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        url: {
          type: 'string',
          description: 'Webhook URL'
        },
        events: {
          type: 'array',
          description: 'Event types to subscribe to',
          items: {
            type: 'string'
          }
        }
      },
      required: ['access_token', 'url', 'events']
    }
  },
  {
    name: 'deleteWebhook',
    description: 'Delete webhook',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        webhook_id: {
          type: 'string',
          description: 'Webhook ID'
        }
      },
      required: ['access_token', 'webhook_id']
    }
  },
  {
    name: 'listWebhooks',
    description: 'List webhooks',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getWebhookEvents',
    description: 'Get available webhook events',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'verifyWebhookSignature',
    description: 'Verify webhook signature',
    inputSchema: {
      type: 'object',
      properties: {
        signature: {
          type: 'string',
          description: 'Signature to verify'
        },
        message_id: {
          type: 'string',
          description: 'Message ID'
        },
        timestamp: {
          type: 'string',
          description: 'Timestamp'
        },
        body: {
          type: 'string',
          description: 'Body content'
        }
      },
      required: ['signature', 'message_id', 'timestamp', 'body']
    }
  },
  {
    name: 'getPublicKey',
    description: 'Get public key for signature verification',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getWebhookPayloads',
    description: 'Get example webhook payloads',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        event_type: {
          type: 'string',
          description: 'Event type'
        }
      },
      required: ['access_token', 'event_type']
    }
  },
  {
    name: 'retryWebhook',
    description: 'Retry failed webhook',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        webhook_id: {
          type: 'string',
          description: 'Webhook ID'
        },
        message_id: {
          type: 'string',
          description: 'Message ID'
        }
      },
      required: ['access_token', 'webhook_id', 'message_id']
    }
  },
  {
    name: 'checkWebhookSubscriptionStatus',
    description: 'Check webhook subscription status',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        webhook_id: {
          type: 'string',
          description: 'Webhook ID'
        }
      },
      required: ['access_token', 'webhook_id']
    }
  },
  // Search and Discovery Methods
  {
    name: 'searchChannels',
    description: 'Search channels',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'searchStreams',
    description: 'Search streams',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'searchUsers',
    description: 'Search users',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'searchCategories',
    description: 'Search categories',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'getCategories',
    description: 'Get categories',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        }
      },
      required: ['access_token']
    }
  },
  {
    name: 'getCategory',
    description: 'Get category',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        category_id: {
          type: 'string',
          description: 'Category ID'
        }
      },
      required: ['access_token', 'category_id']
    }
  },
  {
    name: 'getCategoryStreams',
    description: 'Get category streams',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        category_id: {
          type: 'string',
          description: 'Category ID'
        }
      },
      required: ['access_token', 'category_id']
    }
  },
  {
    name: 'getTopStreams',
    description: 'Get top streams',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        category_id: {
          type: 'string',
          description: 'Category ID'
        }
      },
      required: ['access_token', 'category_id']
    }
  },
  {
    name: 'getRecommendedStreams',
    description: 'Get recommended streams',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        category_id: {
          type: 'string',
          description: 'Category ID'
        }
      },
      required: ['access_token', 'category_id']
    }
  },
  {
    name: 'getFollowedStreams',
    description: 'Get followed streams',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        category_id: {
          type: 'string',
          description: 'Category ID'
        }
      },
      required: ['access_token', 'category_id']
    }
  },
  // Clip Methods
  {
    name: 'createClip',
    description: 'Create clip',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        },
        start_time: {
          type: 'integer',
          description: 'Clip start time in seconds'
        },
        end_time: {
          type: 'integer',
          description: 'Clip end time in seconds'
        }
      },
      required: ['access_token', 'channel_id', 'start_time', 'end_time']
    }
  },
  {
    name: 'getClip',
    description: 'Get clip',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        clip_id: {
          type: 'string',
          description: 'Clip ID'
        }
      },
      required: ['access_token', 'clip_id']
    }
  },
  {
    name: 'deleteClip',
    description: 'Delete clip',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        clip_id: {
          type: 'string',
          description: 'Clip ID'
        }
      },
      required: ['access_token', 'clip_id']
    }
  },
  {
    name: 'updateClip',
    description: 'Update clip',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        clip_id: {
          type: 'string',
          description: 'Clip ID'
        },
        title: {
          type: 'string',
          description: 'Clip title'
        },
        description: {
          type: 'string',
          description: 'Clip description'
        }
      },
      required: ['access_token', 'clip_id', 'title', 'description']
    }
  },
  // Channel by Slug Methods
  {
    name: 'getChannelBySlug',
    description: 'Get channel by slug',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Channel slug'
        }
      },
      required: ['slug']
    }
  },
  // App Access Token Method
  {
    name: 'getAppAccessToken',
    description: 'Get app access token',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'Client ID'
        },
        client_secret: {
          type: 'string',
          description: 'Client Secret'
        }
      },
      required: ['client_id', 'client_secret']
    }
  },
  // Chat Identity Methods
  {
    name: 'getChatSenderIdentity',
    description: 'Get chat sender identity',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  // Subscription Status Methods
  {
    name: 'getChannelSubscriptionStatus',
    description: 'Get channel subscription status',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        channel_id: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['access_token', 'channel_id']
    }
  },
  // Webhook Subscription Methods
  {
    name: 'getWebhookSubscriptions',
    description: 'Get webhook subscriptions',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        webhook_id: {
          type: 'string',
          description: 'Webhook ID'
        }
      },
      required: ['access_token', 'webhook_id']
    }
  },
  {
    name: 'updateWebhookSubscriptions',
    description: 'Update webhook subscriptions',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'Access token'
        },
        webhook_id: {
          type: 'string',
          description: 'Webhook ID'
        },
        subscriptions: {
          type: 'array',
          description: 'Webhook subscriptions',
          items: {
            type: 'string'
          }
        }
      },
      required: ['access_token', 'webhook_id', 'subscriptions']
    }
  },
];

/**
 * Setup and handle JSON-RPC over stdin/stdout for MCP
 */
export const setupMCPHandler = (kickService: KickService): void => {
  // Create JSON-RPC server
  const jsonRpcServer = new JSONRPCServer();

  // Register standard MCP methods
  
  // Initialize method - required by MCP protocol
  jsonRpcServer.addMethod('initialize', async () => {
    logger.info('MCP initialize request received');
    return {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'Kick MCP Server',
        version: process.env.npm_package_version || '1.0.0',
        vendor: 'NosytLabs'
      },
      capabilities: {
        authentication: {
          type: 'oauth2'
        },
        completion: false,
        embeddings: false,
        tools: {
          // Add tool-specific capabilities if needed
          enabled: true,
          toolExecutionMode: 'synchronous',
          toolExecutionApiVersion: '1.0'
        }
      }
    };
  });
  
  // List tools method - required by MCP protocol
  jsonRpcServer.addMethod('tools/list', async () => {
    logger.info('MCP tools/list request received');
    return { tools: toolSchemas };
  });

  // Register API methods
  
  // Authentication Methods
  jsonRpcServer.addMethod('getOAuthUrl', async (params: any) => {
    return kickService.getOAuthUrl(params);
  });
  
  jsonRpcServer.addMethod('getAccessToken', async (params: any) => {
    return kickService.getAccessToken(params);
  });
  
  jsonRpcServer.addMethod('refreshAccessToken', async (params: any) => {
    return kickService.refreshAccessToken(params);
  });
  
  jsonRpcServer.addMethod('validateToken', async (params: any) => {
    return kickService.validateToken(params);
  });
  
  jsonRpcServer.addMethod('revokeToken', async (params: any) => {
    return kickService.revokeToken(params);
  });
  
  // User Methods
  jsonRpcServer.addMethod('getUserProfile', async (params: any) => {
    return kickService.getUserProfile(params);
  });
  
  jsonRpcServer.addMethod('updateUserProfile', async (params: any) => {
    return kickService.updateUserProfile(params);
  });
  
  jsonRpcServer.addMethod('getUserSubscriptions', async (params: any) => {
    return kickService.getUserSubscriptions(params);
  });
  
  jsonRpcServer.addMethod('getUserEmotes', async (params: any) => {
    return kickService.getUserEmotes(params);
  });
  
  jsonRpcServer.addMethod('getUserBadges', async (params: any) => {
    return kickService.getUserBadges(params);
  });
  
  jsonRpcServer.addMethod('getUserFollows', async (params: any) => {
    return kickService.getUserFollows(params);
  });
  
  jsonRpcServer.addMethod('getUserBlockedUsers', async (params: any) => {
    return kickService.getUserBlockedUsers(params);
  });
  
  jsonRpcServer.addMethod('getUserClips', async (params: any) => {
    return kickService.getUserClips(params);
  });
  
  jsonRpcServer.addMethod('getUserVideos', async (params: any) => {
    return kickService.getUserVideos(params);
  });
  
  jsonRpcServer.addMethod('getUserHighlights', async (params: any) => {
    return kickService.getUserHighlights(params);
  });
  
  jsonRpcServer.addMethod('getUserScheduledStreams', async (params: any) => {
    return kickService.getUserScheduledStreams(params);
  });
  
  jsonRpcServer.addMethod('getUserNotifications', async (params: any) => {
    return kickService.getUserNotifications(params);
  });
  
  jsonRpcServer.addMethod('getUserWallet', async (params: any) => {
    return kickService.getUserWallet(params);
  });
  
  jsonRpcServer.addMethod('getUserGifts', async (params: any) => {
    return kickService.getUserGifts(params);
  });
  
  // Chat Methods
  jsonRpcServer.addMethod('getChatMessages', async (params: any) => {
    return kickService.getChatMessages(params);
  });
  
  jsonRpcServer.addMethod('sendChatMessage', async (params: any) => {
    return kickService.sendChatMessage(params);
  });
  
  jsonRpcServer.addMethod('getChatSettings', async (params: any) => {
    return kickService.getChatSettings(params);
  });
  
  jsonRpcServer.addMethod('banUser', async (params: any) => {
    return kickService.banUser(params);
  });
  
  jsonRpcServer.addMethod('unbanUser', async (params: any) => {
    return kickService.unbanUser(params);
  });
  
  jsonRpcServer.addMethod('timeoutUser', async (params: any) => {
    return kickService.timeoutUser(params);
  });
  
  jsonRpcServer.addMethod('deleteMessage', async (params: any) => {
    return kickService.deleteMessage(params);
  });
  
  jsonRpcServer.addMethod('clearChat', async (params: any) => {
    return kickService.clearChat(params);
  });
  
  jsonRpcServer.addMethod('getChatUserInfo', async (params: any) => {
    return kickService.getChatUserInfo(params);
  });
  
  // Channel Methods
  jsonRpcServer.addMethod('getChannelInfo', async (params: any) => {
    return kickService.getChannelInfo(params);
  });
  
  jsonRpcServer.addMethod('getChannelFollowers', async (params: any) => {
    return kickService.getChannelFollowers(params);
  });
  
  jsonRpcServer.addMethod('getChannelSubscribers', async (params: any) => {
    return kickService.getChannelSubscribers(params);
  });
  
  jsonRpcServer.addMethod('getChannelEmotes', async (params: any) => {
    return kickService.getChannelEmotes(params);
  });
  
  jsonRpcServer.addMethod('getChannelBadges', async (params: any) => {
    return kickService.getChannelBadges(params);
  });
  
  jsonRpcServer.addMethod('getChannelModerators', async (params: any) => {
    return kickService.getChannelModerators(params);
  });
  
  jsonRpcServer.addMethod('getChannelBans', async (params: any) => {
    return kickService.getChannelBans(params);
  });
  
  jsonRpcServer.addMethod('getChannelVips', async (params: any) => {
    return kickService.getChannelVips(params);
  });
  
  jsonRpcServer.addMethod('getChannelClips', async (params: any) => {
    return kickService.getChannelClips(params);
  });
  
  jsonRpcServer.addMethod('getChannelVideos', async (params: any) => {
    return kickService.getChannelVideos(params);
  });
  
  jsonRpcServer.addMethod('getChannelHighlights', async (params: any) => {
    return kickService.getChannelHighlights(params);
  });
  
  jsonRpcServer.addMethod('getChannelScheduledStreams', async (params: any) => {
    return kickService.getChannelScheduledStreams(params);
  });
  
  jsonRpcServer.addMethod('getChannelChatRules', async (params: any) => {
    return kickService.getChannelChatRules(params);
  });
  
  jsonRpcServer.addMethod('getChannelChatCommands', async (params: any) => {
    return kickService.getChannelChatCommands(params);
  });
  
  jsonRpcServer.addMethod('getChannelCategories', async (params: any) => {
    return kickService.getChannelCategories(params);
  });
  
  jsonRpcServer.addMethod('getChannelTags', async (params: any) => {
    return kickService.getChannelTags(params);
  });
  
  jsonRpcServer.addMethod('getChannelGifts', async (params: any) => {
    return kickService.getChannelGifts(params);
  });
  
  jsonRpcServer.addMethod('getChannelRaids', async (params: any) => {
    return kickService.getChannelRaids(params);
  });
  
  jsonRpcServer.addMethod('getChannelHosts', async (params: any) => {
    return kickService.getChannelHosts(params);
  });
  
  // Stream Methods
  jsonRpcServer.addMethod('startStream', async (params: any) => {
    return kickService.startStream(params);
  });
  
  jsonRpcServer.addMethod('endStream', async (params: any) => {
    return kickService.endStream(params);
  });
  
  jsonRpcServer.addMethod('updateStreamInfo', async (params: any) => {
    return kickService.updateStreamInfo(params);
  });
  
  jsonRpcServer.addMethod('updateStreamSettings', async (params: any) => {
    return kickService.updateStreamSettings(params);
  });
  
  jsonRpcServer.addMethod('getStreamInfo', async (params: any) => {
    return kickService.getStreamInfo(params);
  });
  
  jsonRpcServer.addMethod('getStreamViewers', async (params: any) => {
    return kickService.getStreamViewers(params);
  });
  
  jsonRpcServer.addMethod('getStreamCategories', async (params: any) => {
    return kickService.getStreamCategories(params);
  });
  
  jsonRpcServer.addMethod('getStreamTags', async (params: any) => {
    return kickService.getStreamTags(params);
  });
  
  jsonRpcServer.addMethod('getStreamStats', async (params: any) => {
    return kickService.getStreamStats(params);
  });
  
  jsonRpcServer.addMethod('createPoll', async (params: any) => {
    return kickService.createPoll(params);
  });
  
  jsonRpcServer.addMethod('endPoll', async (params: any) => {
    return kickService.endPoll(params);
  });
  
  jsonRpcServer.addMethod('createPrediction', async (params: any) => {
    return kickService.createPrediction(params);
  });
  
  jsonRpcServer.addMethod('endPrediction', async (params: any) => {
    return kickService.endPrediction(params);
  });
  
  jsonRpcServer.addMethod('createMarker', async (params: any) => {
    return kickService.createMarker(params);
  });
  
  // Webhook Methods
  jsonRpcServer.addMethod('createWebhook', async (params: any) => {
    return kickService.createWebhook(params);
  });
  
  jsonRpcServer.addMethod('deleteWebhook', async (params: any) => {
    return kickService.deleteWebhook(params);
  });
  
  jsonRpcServer.addMethod('listWebhooks', async (params: any) => {
    return kickService.listWebhooks(params);
  });
  
  jsonRpcServer.addMethod('getWebhookEvents', async (params: any) => {
    return kickService.getWebhookEvents(params);
  });
  
  jsonRpcServer.addMethod('verifyWebhookSignature', async (params: any) => {
    return kickService.verifyWebhookSignature(params);
  });
  
  jsonRpcServer.addMethod('getPublicKey', async () => {
    return kickService.getPublicKey();
  });
  
  jsonRpcServer.addMethod('getWebhookPayloads', async (params: any) => {
    return kickService.getWebhookPayloads(params);
  });
  
  jsonRpcServer.addMethod('retryWebhook', async (params: any) => {
    return kickService.retryWebhook(params);
  });
  
  jsonRpcServer.addMethod('checkWebhookSubscriptionStatus', async (params: any) => {
    return kickService.checkWebhookSubscriptionStatus(params);
  });
  
  // Global Methods
  jsonRpcServer.addMethod('getLivestreams', async () => {
    return kickService.getLivestreams();
  });

  jsonRpcServer.addMethod('getLivestreamBySlug', async (params: any) => {
    return kickService.getLivestreamBySlug(params.slug);
  });

  // Search and Discovery Methods
  jsonRpcServer.addMethod('searchChannels', async (params: any) => {
    return kickService.searchChannels(params);
  });

  jsonRpcServer.addMethod('searchStreams', async (params: any) => {
    return kickService.searchStreams(params);
  });

  jsonRpcServer.addMethod('searchUsers', async (params: any) => {
    return kickService.searchUsers(params);
  });

  jsonRpcServer.addMethod('searchCategories', async (params: any) => {
    return kickService.searchCategories(params);
  });

  jsonRpcServer.addMethod('getCategories', async (params: any) => {
    return kickService.getCategories(params);
  });

  jsonRpcServer.addMethod('getCategory', async (params: any) => {
    return kickService.getCategory(params);
  });

  jsonRpcServer.addMethod('getCategoryStreams', async (params: any) => {
    return kickService.getCategoryStreams(params);
  });

  jsonRpcServer.addMethod('getTopStreams', async (params: any) => {
    return kickService.getTopStreams(params);
  });

  jsonRpcServer.addMethod('getRecommendedStreams', async (params: any) => {
    return kickService.getRecommendedStreams(params);
  });

  jsonRpcServer.addMethod('getFollowedStreams', async (params: any) => {
    return kickService.getFollowedStreams(params);
  });

  // Clip Methods
  jsonRpcServer.addMethod('createClip', async (params: any) => {
    return kickService.createClip(params);
  });

  jsonRpcServer.addMethod('getClip', async (params: any) => {
    return kickService.getClip(params);
  });

  jsonRpcServer.addMethod('deleteClip', async (params: any) => {
    return kickService.deleteClip(params);
  });

  jsonRpcServer.addMethod('updateClip', async (params: any) => {
    return kickService.updateClip(params);
  });

  // Channel by Slug Methods
  jsonRpcServer.addMethod('getChannelBySlug', async (params: any) => {
    return kickService.getChannelBySlug(params);
  });

  // App Access Token Method
  jsonRpcServer.addMethod('getAppAccessToken', async (params: any) => {
    return kickService.getAppAccessToken(params);
  });

  // Chat Identity Methods
  jsonRpcServer.addMethod('getChatSenderIdentity', async (params: any) => {
    return kickService.getChatSenderIdentity(params);
  });

  // Subscription Status Methods
  jsonRpcServer.addMethod('getChannelSubscriptionStatus', async (params: any) => {
    return kickService.getChannelSubscriptionStatus(params);
  });

  // Webhook Subscription Methods
  jsonRpcServer.addMethod('getWebhookSubscriptions', async (params: any) => {
    return kickService.getWebhookSubscriptions(params);
  });

  jsonRpcServer.addMethod('updateWebhookSubscriptions', async (params: any) => {
    return kickService.updateWebhookSubscriptions(params);
  });

  // Create readline interface for stdin
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
  });

  // Process JSON-RPC requests from stdin
  rl.on('line', async (line) => {
    try {
      // Parse the JSON-RPC request
      const jsonRpcRequest: JSONRPCRequest = JSON.parse(line);
      logger.debug('Received JSON-RPC request', { request: jsonRpcRequest });

      // Handle the request
      const response = await jsonRpcServer.receive(jsonRpcRequest);
      
      // Send response to stdout if not null
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (error) {
      logger.error('Error handling JSON-RPC request', error);
      
      // Send error response to stdout
      const errorResponse: JSONRPCResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  });

  // Handle input stream ending
  rl.on('close', () => {
    logger.info('stdin stream closed, exiting');
    process.exit(0);
  });

  logger.info('MCP JSON-RPC handler initialized');
}; 