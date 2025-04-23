import { AuthService } from './AuthService';
import { UserService } from './UserService';
import { ChatService } from './ChatService';
import { ChannelService } from './ChannelService';
import { StreamService } from './StreamService';
import { WebhookService } from './WebhookService';
import { BaseKickService } from './BaseKickService'; // Base class might be needed for options
import { SimpleCache } from '../../utils/cache'; // Cache might be shared

// Export individual services for potential direct use
export * from './AuthService';
export * from './UserService';
export * from './ChatService';
export * from './ChannelService';
export * from './StreamService';
export * from './WebhookService';
export * from './BaseKickService';

/**
 * Aggregator service that provides access to all Kick API service modules.
 */
export class KickService {
  public readonly auth: AuthService;
  public readonly user: UserService;
  public readonly chat: ChatService;
  public readonly channel: ChannelService;
  public readonly stream: StreamService;
  public readonly webhook: WebhookService;
  // Add other services here as they are created (e.g., clips, gifts)

  constructor(options?: { baseUrl?: string; cacheTtl?: number }) {
    // Optionally pass constructor options down to base services if needed
    this.auth = new AuthService(options);
    this.user = new UserService(options);
    this.chat = new ChatService(options);
    this.channel = new ChannelService(options);
    this.stream = new StreamService(options);
    this.webhook = new WebhookService(options);
    // Instantiate other services here
  }

  // You could add convenience methods here that delegate to sub-services if desired
  // e.g., async getUserProfile(params) { return this.user.getUserProfile(params); }
}
// Add exports for any other service files created (e.g., Clips