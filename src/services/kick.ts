import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { KickApiError } from '../utils/errors';
import { SimpleCache } from '../utils/cache';

// List of endpoints that can be cached
const CACHEABLE_ENDPOINTS = [
  '/users/me',
  '/channels/',
  '/categories',
  '/tags'
];

// Default cache TTL in seconds
const DEFAULT_CACHE_TTL = 300; // 5 minutes

export class KickService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private cache: SimpleCache;

  constructor() {
    this.baseUrl = process.env.KICK_API_BASE_URL || 'https://kick.com/api/v2';
    this.apiKey = process.env.KICK_API_KEY || '';
    this.cache = new SimpleCache({ ttl: DEFAULT_CACHE_TTL });
  }

  private async makeRequest<T>(method: string, endpoint: string, params?: any, headers?: any): Promise<T> {
    try {
      // Generate cache key for GET requests
      const isCacheable = method === 'GET' && CACHEABLE_ENDPOINTS.some(path => endpoint.includes(path));
      const cacheKey = isCacheable ? `${method}:${endpoint}:${JSON.stringify(params)}` : '';
      
      // Check cache first for GET requests
      if (cacheKey) {
        const cachedData = this.cache.get<T>(cacheKey);
        if (cachedData) {
          logger.debug(`Cache hit for ${endpoint}`);
          return cachedData;
        }
      }
      
      // Prepare headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };
      
      // Add authorization if access_token is provided in params or apiKey is available
      if (params?.access_token) {
        requestHeaders['Authorization'] = `Bearer ${params.access_token}`;
        // Remove access_token from params to avoid sending it twice
        if (method === 'GET') {
          const { access_token, ...rest } = params;
          params = rest;
        }
      } else if (this.apiKey) {
        requestHeaders['Authorization'] = `Bearer ${this.apiKey}`;
      }

      // Add request timeout
      const timeout = parseInt(process.env.API_TIMEOUT || '10000', 10);
      
      // Make the request
      const startTime = Date.now();
      logger.debug(`API Request: ${method} ${endpoint}`);
      
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: requestHeaders,
        data: method !== 'GET' ? params : undefined,
        params: method === 'GET' ? params : undefined,
        timeout
      });
      
      const duration = Date.now() - startTime;
      logger.debug(`API Response: ${method} ${endpoint} (${duration}ms)`);
      
      const data = response.data as T;
      
      // Cache the response if it's a GET request and cacheable
      if (cacheKey) {
        this.cache.set(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      logger.error(`Kick API Error (${method} ${endpoint}):`, error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        const status = axiosError.response?.status || 500;
        let message = axiosError.response?.data?.message || 'API request failed';
        
        // Add more context to the error
        if (axiosError.code === 'ECONNABORTED') {
          message = 'API request timed out';
        } else if (axiosError.code === 'ENOTFOUND') {
          message = 'API host not found';
        }
        
        // Log rate limiting errors separately
        if (status === 429) {
          logger.warn(`Rate limit exceeded for ${endpoint}`);
        }
        
        throw new KickApiError(message, status);
      }
      
      throw new KickApiError('Unknown API error occurred', 500);
    }
  }

  // Authentication Methods
  async getOAuthUrl(params: { client_id: string, redirect_uri: string, scope: string, state?: string, code_challenge?: string, code_challenge_method?: string }) {
    const { client_id, redirect_uri, scope, state = '', code_challenge = '', code_challenge_method = 'S256' } = params;
    const url = `https://id.kick.com/oauth/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`;
    return { url };
  }

  async getAccessToken(params: { client_id: string, client_secret: string, code: string, redirect_uri: string, code_verifier?: string }) {
    return this.makeRequest('POST', '/oauth/token', {
      grant_type: 'authorization_code',
      client_id: params.client_id,
      client_secret: params.client_secret,
      code: params.code,
      redirect_uri: params.redirect_uri,
      code_verifier: params.code_verifier
    }, { 'Content-Type': 'application/x-www-form-urlencoded' });
  }

  async refreshAccessToken(params: { client_id: string, client_secret: string, refresh_token: string }) {
    return this.makeRequest('POST', '/oauth/token', {
      grant_type: 'refresh_token',
      client_id: params.client_id,
      client_secret: params.client_secret,
      refresh_token: params.refresh_token
    });
  }

  async validateToken(params: { access_token: string }) {
    return this.makeRequest('GET', '/oauth/token/info', {}, {
      'Authorization': `Bearer ${params.access_token}`
    });
  }

  async revokeToken(params: { access_token: string }) {
    return this.makeRequest('POST', '/oauth/token/revoke', {
      token: params.access_token
    });
  }

  // User Methods
  async getUserProfile(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me', params);
  }

  async updateUserProfile(params: { access_token: string, data: any }) {
    return this.makeRequest('PATCH', '/users/me', { 
      ...params.data,
      access_token: params.access_token
    });
  }

  async getUserSubscriptions(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/subscriptions', params);
  }

  async getUserEmotes(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/emotes', params);
  }

  async getUserBadges(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/badges', params);
  }

  async getUserFollows(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/follows', params);
  }

  async getUserBlockedUsers(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/blocks', params);
  }

  async getUserClips(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/clips', params);
  }

  async getUserVideos(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/videos', params);
  }

  async getUserHighlights(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/highlights', params);
  }

  async getUserScheduledStreams(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/scheduled-streams', params);
  }

  async getUserNotifications(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/notifications', params);
  }

  async getUserWallet(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/wallet', params);
  }

  async getUserGifts(params: { access_token: string }) {
    return this.makeRequest('GET', '/users/me/gifts', params);
  }

  // Chat Methods
  async getChatMessages(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/chats/${params.channel_id}/messages`, params);
  }

  async sendChatMessage(params: { access_token: string, channel_id: string, message: string }) {
    return this.makeRequest('POST', `/chats/${params.channel_id}/messages`, {
      message: params.message,
      access_token: params.access_token
    });
  }

  async getChatSettings(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/chats/${params.channel_id}/settings`, params);
  }

  async banUser(params: { access_token: string, channel_id: string, user_id: string }) {
    return this.makeRequest('POST', `/chats/${params.channel_id}/bans`, {
      user_id: params.user_id,
      access_token: params.access_token
    });
  }

  async unbanUser(params: { access_token: string, channel_id: string, user_id: string }) {
    return this.makeRequest('DELETE', `/chats/${params.channel_id}/bans/${params.user_id}`, params);
  }

  async timeoutUser(params: { access_token: string, channel_id: string, user_id: string, duration: number }) {
    return this.makeRequest('POST', `/chats/${params.channel_id}/timeouts`, {
      user_id: params.user_id,
      duration: params.duration,
      access_token: params.access_token
    });
  }

  async deleteMessage(params: { access_token: string, channel_id: string, message_id: string }) {
    return this.makeRequest('DELETE', `/chats/${params.channel_id}/messages/${params.message_id}`, params);
  }

  async clearChat(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('POST', `/chats/${params.channel_id}/clear`, params);
  }

  async getChatUserInfo(params: { access_token: string, channel_id: string, user_id: string }) {
    return this.makeRequest('GET', `/chats/${params.channel_id}/users/${params.user_id}`, params);
  }

  // Channel Methods
  async getChannelInfo(params: { access_token?: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}`, params);
  }

  async getChannelFollowers(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/followers`, params);
  }

  async getChannelSubscribers(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/subscribers`, params);
  }

  async getChannelEmotes(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/emotes`, params);
  }

  async getChannelBadges(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/badges`, params);
  }

  async getChannelModerators(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/moderators`, params);
  }

  async getChannelBans(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/bans`, params);
  }

  async getChannelVips(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/vips`, params);
  }

  async getChannelClips(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/clips`, params);
  }

  async getChannelVideos(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/videos`, params);
  }

  async getChannelHighlights(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/highlights`, params);
  }

  async getChannelScheduledStreams(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/scheduled-streams`, params);
  }

  async getChannelChatRules(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/chat-rules`, params);
  }

  async getChannelChatCommands(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/chat-commands`, params);
  }

  async getChannelCategories(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/categories`, params);
  }

  async getChannelTags(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/tags`, params);
  }

  async getChannelGifts(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/gifts`, params);
  }

  async getChannelRaids(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/raids`, params);
  }

  async getChannelHosts(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/hosts`, params);
  }

  // Stream Methods
  async startStream(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('POST', `/channels/${params.channel_id}/stream/start`, params);
  }

  async endStream(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('POST', `/channels/${params.channel_id}/stream/end`, params);
  }

  async updateStreamInfo(params: { access_token: string, channel_id: string, data: any }) {
    return this.makeRequest('PATCH', `/channels/${params.channel_id}/stream/info`, {
      ...params.data,
      access_token: params.access_token
    });
  }

  async updateStreamSettings(params: { access_token: string, channel_id: string, data: any }) {
    return this.makeRequest('PATCH', `/channels/${params.channel_id}/stream/settings`, {
      ...params.data,
      access_token: params.access_token
    });
  }

  async getStreamInfo(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/streams/current`, params);
  }

  async getStreamViewers(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/streams/current/viewers`, params);
  }

  async getStreamCategories(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/streams/current/categories`, params);
  }

  async getStreamTags(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/streams/current/tags`, params);
  }

  async getStreamStats(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/streams/current/stats`, params);
  }

  async createPoll(params: { access_token: string, channel_id: string, title: string, options: string[], duration: number }) {
    return this.makeRequest('POST', `/channels/${params.channel_id}/polls`, {
      title: params.title,
      options: params.options,
      duration: params.duration,
      access_token: params.access_token
    });
  }

  async endPoll(params: { access_token: string, channel_id: string, poll_id: string }) {
    return this.makeRequest('POST', `/channels/${params.channel_id}/polls/${params.poll_id}/end`, params);
  }

  async createPrediction(params: { access_token: string, channel_id: string, title: string, options: string[], duration: number }) {
    return this.makeRequest('POST', `/channels/${params.channel_id}/predictions`, {
      title: params.title,
      options: params.options,
      duration: params.duration,
      access_token: params.access_token
    });
  }

  async endPrediction(params: { access_token: string, channel_id: string, prediction_id: string, winning_outcome_id: string }) {
    return this.makeRequest('POST', `/channels/${params.channel_id}/predictions/${params.prediction_id}/end`, {
      winning_outcome_id: params.winning_outcome_id,
      access_token: params.access_token
    });
  }

  async createMarker(params: { access_token: string, channel_id: string, description: string }) {
    return this.makeRequest('POST', `/channels/${params.channel_id}/markers`, {
      description: params.description,
      access_token: params.access_token
    });
  }

  // Webhook Methods
  async createWebhook(params: { access_token: string, url: string, events: string[] }) {
    return this.makeRequest('POST', '/webhooks', {
      url: params.url,
      events: params.events,
      access_token: params.access_token
    });
  }

  async deleteWebhook(params: { access_token: string, webhook_id: string }) {
    return this.makeRequest('DELETE', `/webhooks/${params.webhook_id}`, params);
  }

  async listWebhooks(params: { access_token: string }) {
    return this.makeRequest('GET', '/webhooks', params);
  }

  async getWebhookEvents(params: { access_token: string }) {
    return this.makeRequest('GET', '/webhooks/events', params);
  }

  async verifyWebhookSignature(params: { signature: string, message_id: string, timestamp: string, body: any }) {
    // This is typically handled client-side, but we'll provide a helper method
    // You would implement your own signature verification logic here
    return { verified: true };
  }

  async getWebhookPayloads(params: { access_token: string, event_type: string }) {
    return this.makeRequest('GET', `/webhooks/payloads/${params.event_type}`, params);
  }

  async retryWebhook(params: { access_token: string, webhook_id: string, message_id: string }) {
    return this.makeRequest('POST', `/webhooks/${params.webhook_id}/messages/${params.message_id}/retry`, params);
  }

  async checkWebhookSubscriptionStatus(params: { access_token: string, subscription_id: string }) {
    return this.makeRequest('GET', '/webhooks/subscriptions/status', params, {
      'Kick-Event-Subscription-Id': params.subscription_id
    });
  }

  async getPublicKey() {
    return this.makeRequest('GET', '/webhooks/public-key');
  }

  // Global Methods
  async getLivestreams() {
    return this.makeRequest('GET', '/livestreams');
  }

  async getLivestreamBySlug(slug: string) {
    return this.makeRequest('GET', `/livestreams/${slug}`);
  }

  // Search and Discovery Methods
  async searchChannels(params: { query: string, limit?: number, page?: number }) {
    return this.makeRequest('GET', '/search/channels', params);
  }

  async searchStreams(params: { query: string, limit?: number, page?: number }) {
    return this.makeRequest('GET', '/search/streams', params);
  }

  async searchUsers(params: { query: string, limit?: number, page?: number }) {
    return this.makeRequest('GET', '/search/users', params);
  }

  async searchCategories(params: { query: string, limit?: number, page?: number }) {
    return this.makeRequest('GET', '/search/categories', params);
  }

  async getCategories(params?: { limit?: number, page?: number }) {
    return this.makeRequest('GET', '/categories', params || {});
  }

  async getCategory(params: { category_id: string }) {
    return this.makeRequest('GET', `/categories/${params.category_id}`);
  }

  async getCategoryStreams(params: { category_id: string, limit?: number, page?: number }) {
    return this.makeRequest('GET', `/categories/${params.category_id}/streams`, params);
  }

  async getTopStreams(params?: { limit?: number, page?: number }) {
    return this.makeRequest('GET', '/streams/top', params || {});
  }

  async getRecommendedStreams(params: { access_token: string, limit?: number }) {
    return this.makeRequest('GET', '/streams/recommended', params);
  }

  async getFollowedStreams(params: { access_token: string, limit?: number, page?: number }) {
    return this.makeRequest('GET', '/streams/followed', params);
  }

  // Clip Methods
  async createClip(params: { access_token: string, channel_id: string, title?: string }) {
    return this.makeRequest('POST', `/channels/${params.channel_id}/clips`, {
      title: params.title,
      access_token: params.access_token
    });
  }

  async getClip(params: { clip_id: string }) {
    return this.makeRequest('GET', `/clips/${params.clip_id}`);
  }

  async deleteClip(params: { access_token: string, clip_id: string }) {
    return this.makeRequest('DELETE', `/clips/${params.clip_id}`, params);
  }

  async updateClip(params: { access_token: string, clip_id: string, title: string }) {
    return this.makeRequest('PATCH', `/clips/${params.clip_id}`, {
      title: params.title,
      access_token: params.access_token
    });
  }

  // Channel Methods by Slug (Added 08/04/2025 per changelog)
  async getChannelBySlug(params: { slug: string }) {
    return this.makeRequest('GET', `/channels/slug/${params.slug}`);
  }

  // App Access Token (Added 25/03/2025 per changelog)
  async getAppAccessToken(params: { client_id: string, client_secret: string }) {
    return this.makeRequest('POST', '/oauth/token', {
      grant_type: 'client_credentials',
      client_id: params.client_id,
      client_secret: params.client_secret
    });
  }

  // Identity Methods (Added 07/04/2025 per changelog)
  async getChatSenderIdentity(params: { access_token: string, channel_id: string, user_id: string }) {
    return this.makeRequest('GET', `/chat/identity/${params.channel_id}/${params.user_id}`, params);
  }

  // Channel Subscription Status (Added 07/04/2025 per changelog)
  async getChannelSubscriptionStatus(params: { access_token: string, channel_id: string }) {
    return this.makeRequest('GET', `/channels/${params.channel_id}/subscription/status`, params);
  }

  // Webhook Event Subscriptions (Added 24/02/2025 per changelog)
  async getWebhookSubscriptions(params: { access_token: string, webhook_id: string }) {
    return this.makeRequest('GET', `/webhooks/${params.webhook_id}/subscriptions`, params);
  }

  async updateWebhookSubscriptions(params: { access_token: string, webhook_id: string, events: string[] }) {
    return this.makeRequest('PATCH', `/webhooks/${params.webhook_id}/subscriptions`, {
      events: params.events,
      access_token: params.access_token
    });
  }
} 