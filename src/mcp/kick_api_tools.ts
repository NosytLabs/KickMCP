// Import necessary modules and types
import { secureTokenStore } from './auth';
import { KickService } from '../services/kick';
import { logger } from '../utils/logger';
import * as KickTypes from '../types/kick';

// Define standard response interface for consistent return types
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Define the Kick API tools class
class KickApiTools {
  private kickService: KickService;

  constructor() {
    this.kickService = new KickService();
  }

  /**
   * Gets a validated access token from the token store.
   * @returns The access token.
   * @throws Error if no access token is available.
   */
  private getValidatedAccessToken(): string {
    const accessToken = secureTokenStore.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }
    return accessToken;
  }

  /**
   * Gets an App Access Token for application-level API access.
   * @param clientId The client ID of the application.
   * @param clientSecret The client secret of the application.
   * @returns The response data from the API containing the App Access Token.
   */
  async getAppAccessToken(clientId: string, clientSecret: string): Promise<any> {
    try {
      const result = await this.kickService.auth.getAppAccessToken({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error getting App Access Token:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to get App Access Token'
      };
    }
  }

  /**
   * Sends a chat message to a specified channel.
   * @param channelId The ID of the channel to send the message to.
   * @param message The content of the message to send.
   * @param replyToId Optional ID of a message to reply to.
   * @returns The response data from the API.
   */
  async sendChatMessage(channelId: string, message: string, replyToId?: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.chat.sendChatMessage({
        access_token: accessToken,
        channel_id: channelId,
        message: message,
        reply_to: replyToId
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error sending chat message:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to send chat message'
      };
    }
  }

  /**
   * Retrieves information about a specific channel by ID.
   * @param channelId The ID of the channel to retrieve information for.
   * @returns The response data from the API.
   */
  async getChannelInfo(channelId: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.channel.getChannelInfo({
        channel_id: channelId
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error getting channel info:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to get channel info'
      };
    }
  }

  /**
   * Retrieves information about a specific channel by slug.
   * @param channelSlug The slug of the channel to retrieve information for.
   * @returns The response data from the API.
   */
  async getChannelBySlug(channelSlug: string): Promise<any> {
    try {
      const result = await this.kickService.channel.getChannelBySlug({
        slug: channelSlug
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error getting channel by slug:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to get channel by slug'
      };
    }
  }

  /**
   * Retrieves information about a specific user.
   * @param userId The ID of the user to retrieve information for.
   * @returns The response data from the API.
   */
  async getUserInfo(userId: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.user.getUserInfo({
        access_token: accessToken,
        user_id: userId
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error getting user info:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to get user info'
      };
    }
  }

  /**
   * Follows a specified channel.
   * @param channelId The ID of the channel to follow.
   * @returns The response data from the API.
   */
  async followChannel(channelId: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.channel.followChannel({
        access_token: accessToken,
        channel_id: channelId
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error following channel:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to follow channel'
      };
    }
  }

  /**
   * Handles a livestream status webhook event.
   * @param payload The webhook event payload.
   * @returns The processed event data.
   */
  async handleLivestreamStatusEvent(payload: any): Promise<any> {
    try {
      const result = await this.kickService.webhook.handleWebhookEvent(payload);
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error handling livestream status event:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to handle livestream status event'
      };
    }
  }

  /**
   * Unfollows a specified channel.
   * @param channelId The ID of the channel to unfollow.
   * @returns The response data from the API.
   */
  async unfollowChannel(channelId: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.channel.unfollowChannel({
        access_token: accessToken,
        channel_id: channelId
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error unfollowing channel:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to unfollow channel'
      };
    }
  }

  /**
   * Retrieves chat history for a specified channel.
   * @param channelId The ID of the channel to retrieve chat history for.
   * @param limit The maximum number of messages to retrieve.
   * @param before Retrieve messages before this message ID.
   * @param after Retrieve messages after this message ID.
   * @returns The response data from the API.
   */
  async getChatHistory(channelId: string, limit?: number, before?: string, after?: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.chat.getChatHistory({
        access_token: accessToken,
        channel_id: channelId,
        limit: limit,
        before: before,
        after: after
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error getting chat history:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to get chat history'
      };
    }
  }

  /**
   * Registers a webhook for livestream status events.
   * @param url The URL to send webhook events to.
   * @param secret Optional secret for webhook verification.
   * @returns The response data from the API.
   */
  async registerLivestreamStatusWebhook(url: string, secret?: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.webhook.registerWebhook({
        access_token: accessToken,
        url: url,
        events: ['livestream.status'],
        secret: secret
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error registering livestream status webhook:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to register livestream status webhook'
      };
    }
  }

  /**
   * Deletes a chat message from a specified channel.
   * @param channelId The ID of the channel containing the message.
   * @param messageId The ID of the message to delete.
   * @returns The response data from the API.
   */
  async deleteChatMessage(channelId: string, messageId: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.chat.deleteChatMessage({
        access_token: accessToken,
        channel_id: channelId,
        message_id: messageId
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error deleting chat message:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to delete chat message'
      };
    }
  }

  /**
   * Starts a stream for a specified channel.
   * @param channelId The ID of the channel to start the stream for.
   * @returns The response data from the API.
   */
  async startStream(channelId: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.startStream({
        access_token: accessToken,
        channel_id: channelId
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error starting stream:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to start stream'
      };
    }
  }

  /**
   * Ends a stream for a specified channel.
   * @param channelId The ID of the channel to end the stream for.
   * @returns The response data from the API.
   */
  async endStream(channelId: string): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.endStream({
        access_token: accessToken,
        channel_id: channelId
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error ending stream:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to end stream'
      };
    }
  }

  /**
   * Creates a poll in a specified channel.
   * @param channelId The ID of the channel to create the poll in.
   * @param title The title of the poll.
   * @param options The options for the poll.
   * @param duration The duration of the poll in seconds.
   * @returns The response data from the API.
   */
  async createPoll(channelId: string, title: string, options: string[], duration: number): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.createPoll({
        access_token: accessToken,
        channel_id: channelId,
        title: title,
        options: options,
        duration: duration
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error creating poll:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to create poll'
      };
    }
  }

  /**
   * Creates a prediction in a specified channel.
   * @param channelId The ID of the channel to create the prediction in.
   * @param title The title of the prediction.
   * @param options The options for the prediction.
   * @param duration The duration of the prediction in seconds.
   * @returns The response data from the API.
   */
  async createPrediction(channelId: string, title: string, options: string[], duration: number): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.createPrediction({
        access_token: accessToken,
        channel_id: channelId,
        title: title,
        options: options,
        duration: duration
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error creating prediction:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to create prediction'
      };
    }
  }

  /**
   * Updates stream information for a specified channel.
   * @param channelId The ID of the channel to update.
   * @param data The stream information to update.
   * @returns The response data from the API.
   */
  async updateStreamInfo(channelId: string, data: any): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.updateStreamInfo({
        access_token: accessToken,
        channel_id: channelId,
        data: data
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error updating stream info:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update stream info'
      };
    }
  }

  /**
   * Searches for categories based on a query.
   * @param query The search query.
   * @param limit Optional limit for results.
   * @param page Optional page number.
   * @returns The response data from the API.
   */
  async searchCategories(query: string, limit?: number, page?: number): Promise<any> {
    try {
      const result = await this.kickService.searchCategories({
        query: query,
        limit: limit,
        page: page
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error searching categories:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to search categories'
      };
    }
  }

  /**
   * Gets recommended streams for the authenticated user.
   * @param limit Optional limit for results.
   * @returns The response data from the API.
   */
  async getRecommendedStreams(limit?: number): Promise<any> {
    const accessToken = this.getValidatedAccessToken();
    try {
      const result = await this.kickService.getRecommendedStreams({
        access_token: accessToken,
        limit: limit
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error getting recommended streams:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to get recommended streams'
      };
    }
  }

  /**
   * Gets trending content from Kick.
   * @param type The type of content (streams, clips, videos).
   * @param limit Optional limit for results.
   * @param period Optional time period.
   * @returns The response data from the API.
   */
  async getTrendingContent(type: 'streams' | 'clips' | 'videos', limit?: number, period?: string): Promise<any> {
    try {
      const result = await this.kickService.getTrendingContent({
        type: type,
        limit: limit,
        period: period
      });
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error: any) {
      logger.error('Error getting trending content:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to get trending content'
      };
    }
  }

}


// Export an instance of the KickApiTools class
export const kickApiTools = new KickApiTools();
export { KickApiTools };