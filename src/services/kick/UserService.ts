import { BaseKickService } from './BaseKickService';
import * as KickTypes from '../../types/kick';
import { logger } from '../../utils/logger';

/**
 * Service for handling Kick API User methods.
 */
export class UserService extends BaseKickService {
  // Implement the abstract property from BaseKickService
  protected basePath = '/users'; // Base path for user endpoints

  /**
   * Gets the authenticated user's profile.
   * Requires authentication.
   * @param params The request parameters, including the access token.
   * @returns The user profile.
   */
  async getUserProfile(params: { access_token: string }): Promise<KickTypes.User> {
    const endpoint = '/users/me';
    logger.debug('Fetching authenticated user profile');
    return this.makeRequest<KickTypes.User>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  /**
   * Gets the authenticated user's detailed information.
   * Requires authentication.
   * @param params The request parameters, including the access token.
   * @returns The user information.
   */
  async getUserInfo(params: { access_token: string }): Promise<KickTypes.User> { // Assuming return type is User, adjust if different
    const endpoint = '/users/me/info'; // Hypothetical endpoint, verify correct one
    logger.debug('Fetching authenticated user detailed info');
    // If this endpoint exists and returns User type, otherwise adjust type/endpoint
    return this.makeRequest<KickTypes.User>('GET', endpoint, undefined, {}, true, params.access_token);
  }


  /**
   * Updates the authenticated user's profile.
   * Requires authentication.
   * @param params The update parameters, including the access token and data.
   * @returns The updated user profile.
   */
  async updateUserProfile(params: {
    access_token: string;
    username?: string;
    bio?: string;
    profile_image?: string; // Assuming base64 or URL
    banner_image?: string; // Assuming base64 or URL
  }): Promise<KickTypes.User> {
    const endpoint = '/users/me'; // Often PATCH or PUT to the user endpoint
    const { access_token, ...updateData } = params;
    logger.info('Updating user profile');
    return this.makeRequest<KickTypes.User>('PATCH', endpoint, updateData, {}, true, access_token);
  }

    /**
   * Gets the authenticated user's subscriptions.
   * Requires authentication.
   * @param params Request parameters including access_token.
   * @returns User subscriptions.
   */
  async getUserSubscriptions(params: { access_token: string }): Promise<KickTypes.Subscription[]> { // Adjust Type if needed
    const endpoint = '/users/me/subscriptions'; // Verify Kick API endpoint
    logger.debug('Fetching user subscriptions');
    return this.makeRequest<KickTypes.Subscription[]>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  /**
   * Gets the authenticated user's emotes.
   * Requires authentication.
   * @param params Request parameters including access_token
   * @returns User's emotes.
   */
  async getUserEmotes(params: { access_token: string }): Promise<KickTypes.Emote[]> { // Adjust Type if needed
    const endpoint = '/users/me/emotes'; // Verify Kick API endpoint
    logger.debug('Fetching user emotes');
    return this.makeRequest<KickTypes.Emote[]>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  // ... Add other user-related methods from the original KickService here ...
  // Example: getUserFollows, getUserBlockedUsers etc., adapting them to use makeRequest
  // Remember to mark `requiresAuth` as true and pass `params.access_token`

  /**
   * Gets the channels followed by the authenticated user.
   * Requires authentication.
   * @param params Request parameters including access_token.
   * @returns List of followed channels.
   */
  async getUserFollows(params: { access_token: string }): Promise<KickTypes.Channel[]> { // Adjust Type if needed
    const endpoint = '/users/me/follows'; // Verify Kick API endpoint
    logger.debug('Fetching user followed channels');
    return this.makeRequest<KickTypes.Channel[]>('GET', endpoint, undefined, {}, true, params.access_token);
  }

    /**
   * Gets users blocked by the authenticated user.
   * Requires authentication.
   * @param params Request parameters including access_token.
   * @returns List of blocked users.
   */
  async getUserBlockedUsers(params: { access_token: string }): Promise<KickTypes.User[]> { // Adjust Type if needed
    const endpoint = '/users/me/blocks'; // Verify Kick API endpoint
    logger.debug('Fetching blocked users');
    return this.makeRequest<KickTypes.User[]>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  // Stubs for potentially missing methods from handler.ts schema
  // Many endpoints under 'user' in handler.ts might actually be channel-specific
  // or need verification against Kick API documentation.

  // Example: getUserClips might be /clips?user_id=... or /users/me/clips
  async getUserClips(params: { access_token: string; user_id?: string }): Promise<any> {
    const endpoint = `/users/me/clips`; // Verify endpoint
    logger.debug('Fetching user clips');
    return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  async getUserVideos(params: { access_token: string; user_id?: string }): Promise<any> {
      const endpoint = `/users/me/videos`; // Verify endpoint
      logger.debug('Fetching user videos');
      return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
  }

  // getUserWallet, getUserGifts, getUserBadges, etc. - Verify endpoints and add

  async getUserBadges(params: { access_token: string }): Promise<KickTypes.Badge[]> { // Adjust Type if needed
    const endpoint = '/users/me/badges'; // Verify Kick API endpoint
    logger.debug('Fetching user badges');
    return this.makeRequest<KickTypes.Badge[]>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    // --- Potentially Missing endpoints based on handler.ts --- 
    // These need verification against the actual Kick API structure

    async getUserHighlights(params: { access_token: string }): Promise<any> {
        const endpoint = '/users/me/highlights'; // Verify!
        logger.debug('Fetching user highlights');
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    async getUserScheduledStreams(params: { access_token: string }): Promise<any> {
        const endpoint = '/users/me/scheduled-streams'; // Verify!
        logger.debug('Fetching user scheduled streams');
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    async getUserNotifications(params: { access_token: string }): Promise<any> {
        const endpoint = '/users/me/notifications'; // Verify!
        logger.debug('Fetching user notifications');
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    async getUserWallet(params: { access_token: string }): Promise<any> {
        const endpoint = '/users/me/wallet'; // Verify!
        logger.debug('Fetching user wallet');
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }

    async getUserGifts(params: { access_token: string }): Promise<any> {
        const endpoint = '/users/me/gifts'; // Verify!
        logger.debug('Fetching user gifts');
        return this.makeRequest<any>('GET', endpoint, undefined, {}, true, params.access_token);
    }
}