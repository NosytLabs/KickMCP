import { AuthService } from './AuthService';
import { UserService } from './UserService';
import { ChatService } from './ChatService';
import { ChannelService } from './ChannelService';
import { StreamService } from './StreamService';
import { WebhookService } from './WebhookService';
import { BaseKickService } from './BaseKickService';
import { HttpClient } from '../../utils/http/HttpClient';
import { CacheManager } from '../../utils/cache/CacheManager';
import { MCPErrorHandler } from '../../utils/mcpErrorHandler';

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
  // Service instances
  public readonly auth: AuthService;
  public readonly user: UserService;
  public readonly chat: ChatService;
  public readonly channel: ChannelService;
  public readonly stream: StreamService;
  public readonly webhook: WebhookService;
  // Add other services here as they are created (e.g., clips, gifts)
  
  // Shared resources
  private readonly httpClient: HttpClient;
  private readonly cacheManager: CacheManager;
  private readonly baseUrl: string;

  constructor(options?: { baseUrl?: string; cacheTtl?: number }) {
    // Initialize shared resources
    this.baseUrl = options?.baseUrl || process.env.KICK_API_BASE_URL || 'https://api.kick.com/api/v1';
    this.httpClient = new HttpClient({ baseUrl: this.baseUrl });
    this.cacheManager = new CacheManager({ ttl: options?.cacheTtl || 60 });
    
    // Initialize service instances with shared options
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

  /**
   * Verify connection to the Kick API
   * @returns Object indicating connection status and message
   */
  public async verifyApiConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      // Attempt to make a simple API call to verify connectivity
      // Using the channel service as it likely has a public endpoint
      await this.channel.getChannelInfo({ channelName: 'kick' });
      
      return {
        connected: true,
        message: 'Successfully connected to Kick API'
      };
    } catch (error) {
      return {
        connected: false,
        message: MCPErrorHandler.formatErrorMessage('Failed to connect to Kick API', error)
      };
    }
  }
}
// Export CacheService for backward compatibility
export { CacheManager as CacheService } from '../../utils/cache/CacheManager';

// Add exports for any other service files created (e.g., Clips, Gifts, etc.)