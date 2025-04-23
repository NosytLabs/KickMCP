import { BaseKickService } from './BaseKickService';
import * as KickTypes from '../../types/kick';
import { logger } from '../../utils/logger';

/**
 * Service for handling Kick API Stream methods.
 */
export class StreamService extends BaseKickService {

  /**
   * Gets a list of current livestreams.
   * Public endpoint.
   * @param params Optional query parameters (e.g., category, limit).
   * @returns List of livestreams.
   */
  async getLivestreams(params?: Record<string, any>): Promise<KickTypes.Livestream[]> { // Adjust Type if needed
    const endpoint = '/livestreams'; // Verify Kick API endpoint
    logger.debug('Fetching current livestreams');
    return this.makeRequest<KickTypes.Livestream[]>('GET', endpoint, params, {}, false);
  }

  /**
   * Gets livestream information by channel slug.
   * Public endpoint.
   * @param params Request parameters including the channel slug.
   * @returns Livestream information.
   */
  async getLivestreamBySlug(params: { slug: string }): Promise<KickTypes.Livestream> { // Adjust Type if needed
    const endpoint = `/channels/${params.slug}/livestream`; // Verify Kick API endpoint structure
    logger.debug(`Fetching livestream info for slug ${params.slug}`);
    return this.makeRequest<KickTypes.Livestream>('GET', endpoint, undefined, {}, false);
  }

  /**
   * Starts the user's stream.
   * Requires authentication.
   * @param params Request parameters including access_token and channel_id.
   * @returns Success status or stream details.
   */
  async startStream(params: { access_token: string; channel_id: string }): Promise<{ success: boolean; stream_id?: string }> {
    const endpoint = `/channels/${params.channel_id}/stream/start`;
    const { access_token, channel_id } = params;
    
    logger.info(`Attempting to start stream for channel ${channel_id}`);
    
    try {
      const result = await this.makeRequest<{ success: boolean; stream_id?: string }>(
        'POST', 
        endpoint, 
        undefined, 
        {}, 
        true, 
        access_token
      );
      logger.info(`Stream started successfully for channel ${channel_id}`);
      return result;
    } catch (error) {
      if (error instanceof KickApiError) {
        if (error.statusCode === 400) {
          logger.error(`Invalid request when starting stream for channel ${channel_id}`);
          throw new KickApiError('Invalid stream start request. Check channel ID and permissions.', 400);
        } else if (error.statusCode === 403) {
          logger.error(`Permission denied when starting stream for channel ${channel_id}`);
          throw new KickApiError('You do not have permission to start a stream on this channel.', 403);
        } else if (error.statusCode === 409) {
          logger.warn(`Stream already active for channel ${channel_id}`);
          throw new KickApiError('Stream is already active for this channel.', 409);
        }
      }
      throw error;
    }
  }

  /**
   * Ends the user's stream.
   * Requires authentication.
   * @param params Request parameters including access_token and channel_id.
   * @returns Success status.
   */
  async endStream(params: { access_token: string; channel_id: string }): Promise<{ success: boolean }> {
    const endpoint = `/channels/${params.channel_id}/stream/stop`;
    const { access_token, channel_id } = params;
    
    logger.info(`Attempting to end stream for channel ${channel_id}`);
    
    try {
      const result = await this.makeRequest<{ success: boolean }>(
        'POST', 
        endpoint, 
        undefined, 
        {}, 
        true, 
        access_token
      );
      logger.info(`Stream ended successfully for channel ${channel_id}`);
      return result;
    } catch (error) {
      if (error instanceof KickApiError) {
        if (error.statusCode === 400) {
          logger.error(`Invalid request when ending stream for channel ${channel_id}`);
          throw new KickApiError('Invalid stream end request. Check channel ID and permissions.', 400);
        } else if (error.statusCode === 403) {
          logger.error(`Permission denied when ending stream for channel ${channel_id}`);
          throw new KickApiError('You do not have permission to end a stream on this channel.', 403);
        } else if (error.statusCode === 404) {
          logger.warn(`No active stream found for channel ${channel_id}`);
          throw new KickApiError('No active stream found for this channel.', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Updates stream information (title, category, etc.).
   * Requires authentication.
   * @param params Request parameters including access_token, channel_id, and data to update.
   * @returns Updated stream information or success status.
   */
  async updateStreamInfo(params: { access_token: string; channel_id: string; data: Record<string, any> }): Promise<any> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/stream`; // Verify Kick API endpoint (e.g., PATCH? PUT?)
    const { access_token, channel_id, data } = params;
    logger.info(`Updating stream info for channel ${channel_id}`);
    return this.makeRequest<any>('PATCH', endpoint, data, {}, true, access_token);
  }

  /**
   * Gets current stream information for a channel.
   * Requires authentication.
   * @param params Request parameters including access_token and channel_id.
   * @returns Stream information.
   */
  async getStreamInfo(params: { access_token: string; channel_id: string }): Promise<any> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/stream`; // Verify Kick API endpoint
    const { access_token, channel_id } = params;
    logger.debug(`Fetching current stream info for channel ${channel_id}`);
    return this.makeRequest<any>('GET', endpoint, undefined, {}, true, access_token);
  }

  // --- Potentially Missing endpoints based on handler.ts --- 
  // These need verification against the actual Kick API structure

    async updateStreamSettings(params: { access_token: string; channel_id: string; data: Record<string, any> }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/stream/settings`; // Verify!
        const { access_token, channel_id, data } = params;
        logger.info(`Updating stream settings for channel ${channel_id}`);
        return this.makeRequest<any>('PUT', endpoint, data, {}, true, access_token); // or PATCH
    }

    async getStreamViewers(params: { access_token?: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/stream/viewers`; // Verify!
        logger.debug(`Fetching stream viewers for channel ${params.channel_id}`);
        const requiresAuth = !!params.access_token; // May require auth for detailed list
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getStreamCategories(params: { access_token?: string; channel_id: string }): Promise<any> {
        // Likely uses the global categories endpoint, or channel settings
        const endpoint = `/channels/${params.channel_id}/stream/categories`; // Verify!
        logger.debug(`Fetching stream categories for channel ${params.channel_id}`);
        const requiresAuth = !!params.access_token;
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getStreamTags(params: { access_token?: string; channel_id: string }): Promise<any> {
        // Likely uses the global tags endpoint, or channel settings
        const endpoint = `/channels/${params.channel_id}/stream/tags`; // Verify!
        logger.debug(`Fetching stream tags for channel ${params.channel_id}`);
        const requiresAuth = !!params.access_token;
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getStreamStats(params: { access_token: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/stream/stats`; // Verify!
        logger.debug(`Fetching stream stats for channel ${params.channel_id}`);
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    async createPoll(params: {
        access_token: string;
        channel_id: string;
        title: string;
        options: string[];
        duration: number; // seconds
    }): Promise<any> { // Adjust type
        const endpoint = `/channels/${params.channel_id}/polls`; // Verify!
        const { access_token, channel_id, ...body } = params;
        logger.info(`Creating poll for channel ${channel_id}: ${body.title}`);
        return this.makeRequest<any>('POST', endpoint, body, {}, true, access_token);
    }

    async endPoll(params: {
        access_token: string;
        channel_id: string;
        poll_id: string;
    }): Promise<any> { // Adjust type
        const endpoint = `/channels/${params.channel_id}/polls/${params.poll_id}/end`; // Fixed template literal
        const { access_token, channel_id, poll_id } = params;
        logger.info(`Ending poll ${poll_id} for channel ${channel_id}`);
        return this.makeRequest<any>('POST', endpoint, {}, {}, true, access_token);
    }
}