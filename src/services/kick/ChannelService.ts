import { BaseKickService } from './BaseKickService';
import * as KickTypes from '../../types/kick';
import { logger } from '../../utils/logger';

/**
 * Service for handling Kick API Channel methods.
 */
export class ChannelService extends BaseKickService {

  /**
   * Gets information for a specific channel by ID.
   * Public endpoint, no authentication needed typically.
   * @param params Request parameters including channel_id.
   * @returns Channel information.
   */
  async getChannelInfo(params: { channel_id: string }): Promise<KickTypes.Channel> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}`;
    logger.debug(`Fetching info for channel ID ${params.channel_id}`);
    // Assuming public access, requiresAuth=false
    return this.makeRequest<KickTypes.Channel>('GET', endpoint, undefined, {}, false);
  }

  /**
   * Gets information for a specific channel by slug.
   * Public endpoint, no authentication needed typically.
   * @param params Request parameters including slug.
   * @returns Channel information.
   */
  async getChannelBySlug(params: { slug: string }): Promise<KickTypes.Channel> {
    const endpoint = `/channels/slug/${params.slug}`;
    logger.debug(`Fetching info for channel slug ${params.slug}`);
    // Assuming public access, requiresAuth=false
    return this.makeRequest<KickTypes.Channel>('GET', endpoint, undefined, {}, false);
  }

  /**
    * Gets followers for a specific channel.
    * Requires authentication depending on privacy settings or API design.
    * @param params Request parameters including channel_id and optional access_token.
    * @returns List of followers.
    */
   async getChannelFollowers(params: { access_token?: string; channel_id: string }): Promise<KickTypes.Follower[]> { // Adjust Type if needed
       const endpoint = `/channels/${params.channel_id}/followers`; // Verify
       logger.debug(`Fetching followers for channel ${params.channel_id}`);
       // Assuming this might need auth for private channels or detailed info
       const requiresAuth = !!params.access_token;
       return this.makeRequest<KickTypes.Follower[]>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
   }

  /**
   * Gets subscribers for a specific channel.
   * Requires authentication.
   * @param params Request parameters including access_token and channel_id.
   * @returns List of subscribers.
   */
  async getChannelSubscribers(params: { access_token: string; channel_id: string }): Promise<KickTypes.Subscription[]> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/subscribers`; // Verify Kick API endpoint
    logger.debug(`Fetching subscribers for channel ${params.channel_id}`);
    return this.makeRequest<KickTypes.Subscription[]>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  /**
   * Gets emotes for a specific channel.
   * Requires auth sometimes?
   * @param params Request parameters including channel_id and optional access_token.
   * @returns List of channel emotes.
   */
    async getChannelEmotes(params: { access_token?: string; channel_id: string }): Promise<KickTypes.Emote[]> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/emotes`; // Verify Kick API endpoint
    logger.debug(`Fetching emotes for channel ${params.channel_id}`);
    const requiresAuth = !!params.access_token; // Some emotes might be public?
    return this.makeRequest<KickTypes.Emote[]>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
  }

   /**
    * Gets badges for a specific channel.
    * Requires auth sometimes?
    * @param params Request parameters including channel_id and optional access_token.
    * @returns List of channel badges.
    */
   async getChannelBadges(params: { access_token?: string; channel_id: string }): Promise<KickTypes.Badge[]> { // Adjust Type if needed
       const endpoint = `/channels/${params.channel_id}/badges`; // Verify
       logger.debug(`Fetching badges for channel ${params.channel_id}`);
       const requiresAuth = !!params.access_token;
       return this.makeRequest<KickTypes.Badge[]>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
   }

  /**
   * Gets moderators for a specific channel.
   * Requires authentication.
   * @param params Request parameters including access_token and channel_id.
   * @returns List of moderators.
   */
  async getChannelModerators(params: { access_token: string; channel_id: string }): Promise<KickTypes.Moderator[]> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/moderators`; // Verify Kick API endpoint
    logger.debug(`Fetching moderators for channel ${params.channel_id}`);
    return this.makeRequest<KickTypes.Moderator[]>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  /**
   * Gets banned users for a specific channel.
   * Requires authentication and moderator permissions.
   * @param params Request parameters including access_token and channel_id.
   * @returns List of banned users.
   */
  async getChannelBans(params: { access_token: string; channel_id: string }): Promise<KickTypes.Ban[]> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/bans`; // Verify Kick API endpoint
    logger.debug(`Fetching bans for channel ${params.channel_id}`);
    return this.makeRequest<KickTypes.Ban[]>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  /**
   * Gets VIP users for a specific channel.
   * Requires authentication.
   * @param params Request parameters including access_token and channel_id.
   * @returns List of VIP users.
   */
  async getChannelVips(params: { access_token: string; channel_id: string }): Promise<KickTypes.Vip[]> { // Adjust Type if needed
    const endpoint = `/channels/${params.channel_id}/vips`; // Verify Kick API endpoint
    logger.debug(`Fetching VIPs for channel ${params.channel_id}`);
    return this.makeRequest<KickTypes.Vip[]>('GET', endpoint, undefined, {}, true, params.access_token);
  }

    /**
     * Updates channel settings.
     * Requires authentication.
     * @param params Request parameters including access_token, channel_id, and settings data.
     * @returns Updated channel settings or success status.
     */
    async updateChannelSettings(params: { access_token: string; channel_id: string; data: Record<string, any> }): Promise<any> { // Adjust return type
        const endpoint = `/channels/${params.channel_id}/settings`; // Verify
        const { access_token, channel_id, data } = params;
        logger.info(`Updating settings for channel ${channel_id}`);
        return this.makeRequest<any>('PUT', endpoint, data, {}, true, access_token); // Or PATCH
    }

    /**
     * Gets channel settings.
     * Requires authentication.
     * @param params Request parameters including access_token and channel_id.
     * @returns Channel settings.
     */
    async getChannelSettings(params: { access_token: string; channel_id: string }): Promise<any> { // Adjust return type
        const endpoint = `/channels/${params.channel_id}/settings`; // Verify
        logger.debug(`Fetching settings for channel ${params.channel_id}`);
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }
}
  
  // --- Potentially Missing endpoints based on handler.ts --- 
  // These need verification against the actual Kick API structure

    async getChannelClips(params: { access_token?: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/clips`; // Verify!
        logger.debug(`Fetching clips for channel ${params.channel_id}`);
        const requiresAuth = !!params.access_token;
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getChannelVideos(params: { access_token?: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/videos`; // Verify!
        logger.debug(`Fetching videos for channel ${params.channel_id}`);
        const requiresAuth = !!params.access_token;
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getChannelHighlights(params: { access_token?: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/highlights`; // Verify!
        logger.debug(`Fetching highlights for channel ${params.channel_id}`);
        const requiresAuth = !!params.access_token;
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getChannelScheduledStreams(params: { access_token?: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/scheduled-streams`; // Verify!
        logger.debug(`Fetching scheduled streams for channel ${params.channel_id}`);
        const requiresAuth = !!params.access_token;
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getChannelCategories(params: { access_token?: string; channel_id: string }): Promise<any> {
        // Categories might be global or channel-specific, verify endpoint
        const endpoint = `/channels/${params.channel_id}/categories`; // Verify!
        logger.debug(`Fetching categories for channel ${params.channel_id}`);
        const requiresAuth = !!params.access_token;
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getChannelTags(params: { access_token?: string; channel_id: string }): Promise<any> {
        // Tags might be global or channel-specific, verify endpoint
        const endpoint = `/channels/${params.channel_id}/tags`; // Verify!
        logger.debug(`Fetching tags for channel ${params.channel_id}`);
         const requiresAuth = !!params.access_token;
        return this.makeRequest<any>('GET', endpoint, undefined, {}, requiresAuth, params.access_token);
    }

    async getChannelGifts(params: { access_token: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/gifts`; // Verify!
        logger.debug(`Fetching gifts for channel ${params.channel_id}`);
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    async getChannelRaids(params: { access_token: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/raids`; // Verify!
        logger.debug(`Fetching raids for channel ${params.channel_id}`);
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    async getChannelHosts(params: { access_token: string; channel_id: string }): Promise<any> {
        const endpoint = `/channels/${params.channel_id}/hosts`; // Verify!
        logger.debug(`Fetching hosts for channel ${params.channel_id}`);
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }
}