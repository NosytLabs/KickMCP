import { SimpleCache } from '../utils/cache';
import { DEFAULT_CACHE_TTL } from './kick/BaseKickService';
import {
  KickService as ModularKickService,
  AuthService,
  UserService,
  ChatService,
  ChannelService,
  StreamService
} from './kick';

/**
 * @deprecated Use the new modular KickService from './services/kick' instead.
 * This class is maintained for backward compatibility and will be removed in a future version.
 */
export class KickService {
  private readonly modularService: ModularKickService;

  constructor(options?: { baseUrl?: string; cacheTtl?: number }) {
    this.modularService = new ModularKickService(options);
  }

  // Delegate user-related methods to the new UserService
  async getUserProfile(params: { access_token: string }) {
    return this.modularService.user.getUserProfile(params);
  }

  async getUserInfo(params: { access_token: string }) {
    return this.modularService.user.getUserInfo(params);
  }

  async updateUserProfile(params: {
    access_token: string;
    username?: string;
    bio?: string;
    profile_image?: string;
    banner_image?: string;
  }) {
    return this.modularService.user.updateUserProfile(params);
  }

  // Additional user-related methods delegated to the new UserService
  async getUserSubscriptions(params: { access_token: string }) {
    return this.modularService.user.getUserSubscriptions(params);
  }

  async getUserEmotes(params: { access_token: string }) {
    return this.modularService.user.getUserEmotes(params);
  }

  async getUserFollows(params: { access_token: string }) {
    return this.modularService.user.getUserFollows(params);
  }

  async getUserBlockedUsers(params: { access_token: string }) {
    return this.modularService.user.getUserBlockedUsers(params);
  }

  async getUserClips(params: { access_token: string; user_id?: string }) {
    return this.modularService.user.getUserClips(params);
  }

  async getUserVideos(params: { access_token: string; user_id?: string }) {
    return this.modularService.user.getUserVideos(params);
  }

  async getUserBadges(params: { access_token: string }) {
    return this.modularService.user.getUserBadges(params);
  }

  async getUserHighlights(params: { access_token: string }) {
    return this.modularService.user.getUserHighlights(params);
  }

  async getUserScheduledStreams(params: { access_token: string }) {
    return this.modularService.user.getUserScheduledStreams(params);
  }

  async getUserNotifications(params: { access_token: string }) {
    return this.modularService.user.getUserNotifications(params);
  }

  async getUserWallet(params: { access_token: string }) {
    return this.modularService.user.getUserWallet(params);
  }

  async getUserGifts(params: { access_token: string }) {
    return this.modularService.user.getUserGifts(params);
  }

  // This maintains backward compatibility while using the new modular architecture
}