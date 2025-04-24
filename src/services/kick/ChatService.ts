import { BaseKickService } from './BaseKickService';
import * as KickTypes from '../../types/kick';
import { logger } from '../../utils/logger';

/**
 * Service for handling Kick API Chat methods.
 */
export class ChatService extends BaseKickService {
  // Implement the abstract property from BaseKickService
  protected basePath = '/chat'; // Base path for chat endpoints

  /**
   * Gets chat history for a channel.
   * Requires authentication.
   * @param params Request parameters including access_token, channel_id, and optional filters.
   * @returns Chat history messages.
   */
  async getChatHistory(params: {
    access_token: string;
    channel_id: string;
    limit?: number;
    before?: string; // Message ID or timestamp
    after?: string; // Message ID or timestamp
  }): Promise<KickTypes.ChatMessage[]> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/messages`; // Verify Kick API endpoint
    const { access_token, channel_id, ...queryParams } = params;
    logger.debug(`Fetching chat history for channel ${channel_id}`);
    return this.makeRequest<KickTypes.ChatMessage[]>('GET', endpoint, queryParams, {}, true, access_token);
  }

  /**
   * Sends a chat message to a channel.
   * Requires authentication and specific chat scope.
   * @param params Request parameters including access_token, channel_id, message content, and optional reply_to.
   * @returns The sent message object.
   */
  async sendChatMessage(params: {
    access_token: string;
    channel_id: string;
    message: string;
    reply_to?: string; // Message ID to reply to
  }): Promise<KickTypes.ChatMessage> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/messages`; // Verify Kick API endpoint
    const { access_token, channel_id, ...body } = params;
    logger.info(`Sending message to channel ${channel_id}: ${body.message.substring(0, 50)}...`);
    return this.makeRequest<KickTypes.ChatMessage>('POST', endpoint, body, {}, true, access_token);
  }

  /**
   * Bans a user from a channel's chat.
   * Requires authentication and moderator permissions.
   * @param params Request parameters including access_token, channel_id, and user_id to ban.
   * @returns Success status or relevant ban info.
   */
  async banUser(params: {
    access_token: string;
    channel_id: string;
    user_id: string;
    reason?: string;
  }): Promise<{ success: boolean }> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/bans`; // Verify Kick API endpoint
    const { access_token, channel_id, user_id, reason } = params;
    const body = { user_id: user_id, reason: reason };
    logger.warn(`Banning user ${user_id} from channel ${channel_id}`);
    return this.makeRequest<{ success: boolean }>('POST', endpoint, body, {}, true, access_token);
  }

  /**
   * Unbans a user from a channel's chat.
   * Requires authentication and moderator permissions.
   * @param params Request parameters including access_token, channel_id, and user_id to unban.
   * @returns Success status.
   */
  async unbanUser(params: {
    access_token: string;
    channel_id: string;
    user_id: string;
  }): Promise<{ success: boolean }> { // Adjust Type if needed
    // Endpoint might be DELETE /channels/{channel_id}/bans/{user_id} or similar
    const endpoint = `/channels/${params.channel_id}/bans/${params.user_id}`; // Verify Kick API endpoint and method
    const { access_token, channel_id, user_id } = params;
    logger.warn(`Unbanning user ${user_id} from channel ${channel_id}`);
    return this.makeRequest<{ success: boolean }>('DELETE', endpoint, undefined, {}, true, access_token);
  }

  /**
   * Times out a user in a channel's chat.
   * Requires authentication and moderator permissions.
   * @param params Request parameters including access_token, channel_id, user_id, and duration.
   * @returns Success status or timeout details.
   */
  async timeoutUser(params: {
    access_token: string;
    channel_id: string;
    user_id: string;
    duration: number; // Duration in seconds
    reason?: string;
  }): Promise<{ success: boolean }> { // Adjust Type if needed
    // Endpoint could be POST /channels/{channel_id}/timeouts or similar
    const endpoint = `/channels/${params.channel_id}/timeouts`; // Verify Kick API endpoint
    const { access_token, channel_id, user_id, duration, reason } = params;
    const body = { user_id, duration, reason };
    logger.warn(`Timing out user ${user_id} in channel ${channel_id} for ${duration}s`);
    return this.makeRequest<{ success: boolean }>('POST', endpoint, body, {}, true, access_token);
  }

  /**
   * Deletes a specific chat message.
   * Requires authentication and moderator/user permissions.
   * @param params Request parameters including access_token, channel_id, and message_id.
   * @returns Success status.
   */
  async deleteChatMessage(params: {
    access_token: string;
    channel_id: string;
    message_id: string;
  }): Promise<{ success: boolean }> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/messages/${params.message_id}`; // Verify Kick API endpoint
    const { access_token, channel_id, message_id } = params;
    logger.warn(`Deleting message ${message_id} from channel ${channel_id}`);
    return this.makeRequest<{ success: boolean }>('DELETE', endpoint, undefined, {}, true, access_token);
  }

  /**
   * Clears all chat messages in a channel.
   * Requires authentication and moderator permissions.
   * @param params Request parameters including access_token and channel_id.
   * @returns Success status.
   */
  async clearChat(params: {
    access_token: string;
    channel_id: string;
  }): Promise<{ success: boolean }> { // Adjust Type if needed
    // Endpoint likely DELETE /channels/{channel_id}/messages or similar
    const endpoint = `/channels/${params.channel_id}/messages`; // Verify Kick API endpoint
    const { access_token, channel_id } = params;
    logger.warn(`Clearing chat for channel ${channel_id}`);
    return this.makeRequest<{ success: boolean }>('DELETE', endpoint, undefined, {}, true, access_token);
  }

  // --- Potentially Missing endpoints based on handler.ts --- 
  // These need verification against the actual Kick API structure

    async getChannelChatRules(params: { access_token: string, channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/chat/rules`; // Verify!
        logger.debug(`Fetching chat rules for channel ${params.channel_id}`);
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    async getChannelChatCommands(params: { access_token: string, channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/chat/commands`; // Verify!
        logger.debug(`Fetching chat commands for channel ${params.channel_id}`);
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }
}