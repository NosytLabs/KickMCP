import { BaseKickService } from './BaseKickService';
import * as KickTypes from '../../types/kick';
import { logger } from '../../utils/logger';
import { KickApiError } from '../../utils/errors';
import { EventEmitter } from 'events';

/**
 * Service for handling Kick API Webhook methods.
 * Provides functionality for registering webhooks and handling webhook events.
 */
export class WebhookService extends BaseKickService {
  protected basePath = '/webhooks';
  private eventEmitter: EventEmitter;

  constructor(options?: { baseUrl?: string; cacheTtl?: number }) {
    super(options);
    this.eventEmitter = new EventEmitter();
    // Set higher limit for webhook event listeners
    this.eventEmitter.setMaxListeners(50);
  }

  /**
   * Registers a new webhook endpoint with Kick API.
   * Requires authentication.
   * @param params The webhook registration parameters.
   * @returns The registered webhook details.
   */
  async registerWebhook(params: {
    access_token: string;
    url: string;
    events: string[];
    secret?: string; // Optional secret for webhook verification
  }): Promise<KickTypes.Webhook> {
    const endpoint = '';
    const { access_token, ...webhookData } = params;
    
    logger.info(`Registering webhook for URL: ${params.url} with events: ${params.events.join(', ')}`);
    try {
      return await this.makeRequest<KickTypes.Webhook>('POST', endpoint, webhookData, {}, true, access_token);
    } catch (error) {
      if (error instanceof KickApiError) {
        if (error.statusCode === 400) {
          logger.error('Invalid webhook registration data', { url: params.url, events: params.events });
        } else if (error.statusCode === 409) {
          logger.warn('Webhook URL already registered', { url: params.url });
        }
      }
      throw error;
    }
  }

  /**
   * Handles incoming webhook events, particularly livestream status events.
   * @param payload The webhook event payload.
   * @returns Processed event data.
   */
  async handleWebhookEvent(payload: any): Promise<any> {
    logger.debug('Received webhook event', { event_type: payload.type });
    
    // Handle livestream status events
    if (payload.type === 'livestream.status') {
      const livestreamData = payload.data;
      logger.info(`Livestream status changed for channel ${livestreamData.channel_id}: ${livestreamData.status}`);
      
      // Emit event for subscribers to consume
      this.eventEmitter.emit('livestream.status', livestreamData);
      
      return {
        success: true,
        event: 'livestream.status',
        data: livestreamData
      };
    }
    
    // Handle other event types as they are implemented
    logger.warn(`Unhandled webhook event type: ${payload.type}`);
    return {
      success: false,
      error: `Unhandled webhook event type: ${payload.type}`
    };
  }

  /**
   * Gets all registered webhooks for the authenticated user.
   * Requires authentication.
   * @param params The request parameters.
   * @returns List of registered webhooks.
   */
  async getWebhooks(params: { access_token: string }): Promise<KickTypes.Webhook[]> {
    const endpoint = '';
    logger.debug('Fetching registered webhooks');
    
    try {
      return await this.makeRequest<KickTypes.Webhook[]>('GET', endpoint, undefined, {}, true, params.access_token);
    } catch (error) {
      if (error instanceof KickApiError && error.statusCode === 404) {
        // No webhooks found, return empty array instead of error
        logger.info('No webhooks registered for this user');
        return [];
      }
      throw error;
    }
  }

  /**
   * Updates an existing webhook configuration.
   * Requires authentication.
   * @param params The webhook update parameters.
   * @returns The updated webhook details.
   */
  async updateWebhook(params: {
    access_token: string;
    webhook_id: number;
    url?: string;
    events?: string[];
    status?: 'active' | 'disabled';
    secret?: string;
  }): Promise<KickTypes.Webhook> {
    const { access_token, webhook_id, ...updateData } = params;
    const endpoint = `/${webhook_id}`;
    
    logger.info(`Updating webhook ID: ${webhook_id}`);
    try {
      return await this.makeRequest<KickTypes.Webhook>('PATCH', endpoint, updateData, {}, true, access_token);
    } catch (error) {
      if (error instanceof KickApiError) {
        if (error.statusCode === 404) {
          logger.error(`Webhook ID ${webhook_id} not found`);
        } else if (error.statusCode === 400) {
          logger.error('Invalid webhook update data', { webhook_id, ...updateData });
        }
      }
      throw error;
    }
  }

  /**
   * Deletes a registered webhook.
   * Requires authentication.
   * @param params The webhook deletion parameters.
   * @returns Success status.
   */
  async deleteWebhook(params: {
    access_token: string;
    webhook_id: number;
  }): Promise<{ success: boolean }> {
    const endpoint = `/${params.webhook_id}`;
    
    logger.info(`Deleting webhook ID: ${params.webhook_id}`);
    try {
      await this.makeRequest<void>('DELETE', endpoint, undefined, {}, true, params.access_token);
      return { success: true };
    } catch (error) {
      if (error instanceof KickApiError && error.statusCode === 404) {
        logger.warn(`Webhook ID ${params.webhook_id} not found or already deleted`);
        return { success: false };
      }
      throw error;
    }
  }

  /**
   * Verifies a webhook signature from Kick.
   * @param signature The signature from the webhook request headers.
   * @param payload The raw webhook payload.
   * @param secret The webhook secret used during registration.
   * @returns Whether the signature is valid.
   */
  verifyWebhookSignature(signature: string, payload: string, secret: string): boolean {
    // Implementation depends on how Kick signs webhooks
    // This is a placeholder implementation
    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      const calculatedSignature = hmac.update(payload).digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    } catch (error) {
      logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Processes an incoming webhook event.
   * @param event The event type.
   * @param payload The webhook payload.
   */
  processWebhookEvent(event: string, payload: any): void {
    logger.debug(`Processing webhook event: ${event}`, { payload });
    this.eventEmitter.emit(event, payload);
    // Also emit a 'all' event for listeners that want all events
    this.eventEmitter.emit('all', { event, payload });
  }

  /**
   * Registers a listener for webhook events.
   * @param event The event type to listen for, or 'all' for all events.
   * @param listener The callback function to execute when the event occurs.
   */
  on(event: string, listener: (payload: any) => void): void {
    this.eventEmitter.on(event, listener);
    logger.debug(`Registered listener for webhook event: ${event}`);
  }

  /**
   * Removes a listener for webhook events.
   * @param event The event type.
   * @param listener The callback function to remove.
   */
  off(event: string, listener: (payload: any) => void): void {
    this.eventEmitter.off(event, listener);
    logger.debug(`Removed listener for webhook event: ${event}`);
  }

  /**
   * Registers a one-time listener for webhook events.
   * @param event The event type to listen for, or 'all' for all events.
   * @param listener The callback function to execute when the event occurs.
   */
  once(event: string, listener: (payload: any) => void): void {
    this.eventEmitter.once(event, listener);
    logger.debug(`Registered one-time listener for webhook event: ${event}`);
  }
}