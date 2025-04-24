# Kick API Implementation Plan

## Introduction

This document outlines the implementation plan for updating our KickMCP server to align with the latest features and changes in the official Kick API. Based on our analysis of the [official Kick API documentation](https://github.com/KickEngineering/KickDevDocs), we've identified several features that need to be added or updated in our implementation.

## Priority Features

The following features will be implemented in order of priority:

### High Priority

1. **Reply Chat Message Support**
   - Update `ChatService.ts` to support the new reply functionality
   - Modify chat message types to include reply-related fields

2. **Channel Slug Endpoint**
   - Add new method in `ChannelService.ts` to retrieve channels by slug
   - Update relevant types and documentation

3. **Livestream Status Webhook Event**
   - Update `WebhookService.ts` to handle the new livestream status events
   - Add event types and processing logic

### Medium Priority

4. **App Access Tokens**
   - Implement support in `auth.ts` for App Access Tokens
   - Update authentication flow to utilize this new token type

5. **Channel Response Updates**
   - Add thumbnail support in channel responses
   - Update livestream information handling in channel endpoints

### Lower Priority

6. **Identity Object in Chat Sender**
   - Update chat message types to include the identity object
   - Ensure proper handling in the ChatService

7. **Subscription Payload Updates**
   - Add expires_at field to subscription types
   - Update subscription-related methods

## Implementation Details

### 1. Reply Chat Message Support

```typescript
// Update in src/types/kick.ts
export interface ChatMessage {
  // Existing fields...
  replied_to?: {
    id: string;
    message: string;
    user: User;
    created_at: string;
  };
}

// Update in src/services/kick/ChatService.ts
async sendChatMessage(params: {
  access_token: string;
  channel_id: string;
  message: string;
  reply_to?: string; // Message ID to reply to
}): Promise<KickTypes.ChatMessage> {
  const endpoint = `/channels/${params.channel_id}/messages`;
  const { access_token, channel_id, ...body } = params;
  logger.info(`Sending message to channel ${channel_id}: ${body.message.substring(0, 50)}...`);
  return this.makeRequest<KickTypes.ChatMessage>('POST', endpoint, body, {}, true, access_token);
}
```

### 2. Channel Slug Endpoint

```typescript
// Add to src/services/kick/ChannelService.ts
async getChannelBySlug(params: { slug: string; access_token?: string }): Promise<KickTypes.Channel> {
  const endpoint = `/channels/slug/${params.slug}`;
  const { access_token, slug } = params;
  const requiresAuth = !!access_token;
  
  logger.debug(`Fetching channel info for slug ${slug}`);
  return this.makeRequest<KickTypes.Channel>('GET', endpoint, undefined, {}, requiresAuth, access_token);
}
```

### 3. Livestream Status Webhook Event

```typescript
// Update in src/types/kick.ts
export enum WebhookEventType {
  // Existing events...
  LIVESTREAM_STATUS = 'livestream.status'
}

export interface LivestreamStatusEvent {
  channel_id: number;
  livestream_id: number;
  status: 'live' | 'ended';
  started_at?: string;
  ended_at?: string;
}

// Update in src/services/kick/WebhookService.ts
private handleLivestreamStatusEvent(event: KickTypes.LivestreamStatusEvent): void {
  const { channel_id, status, livestream_id } = event;
  logger.info(`Livestream status changed for channel ${channel_id}: ${status}`);
  
  this.eventEmitter.emit('livestream.status', {
    channel_id,
    livestream_id,
    status,
    timestamp: new Date().toISOString()
  });
}
```

### 4. App Access Tokens

```typescript
// Update in src/mcp/auth.ts
async function getAppAccessToken(): Promise<string> {
  try {
    const response = await axios.post('https://kick.com/oauth/token', {
      grant_type: 'client_credentials',
      client_id: process.env.KICK_CLIENT_ID,
      client_secret: process.env.KICK_CLIENT_SECRET,
      scope: 'channel:read chat:read chat:write'
    });
    
    return response.data.access_token;
  } catch (error) {
    logger.error('Failed to obtain app access token', error);
    throw new Error('Failed to obtain app access token');
  }
}
```

## Testing Plan

1. Create unit tests for each new feature
2. Implement integration tests for the webhook events
3. Manual testing of chat reply functionality
4. Verify channel slug endpoint with various channels
5. Test App Access Token authentication flow

## Documentation Updates

1. Update README.md with new features
2. Add examples for using new endpoints
3. Update webhook integration documentation
4. Document the App Access Token flow

## Timeline

- Week 1: Implement high priority features (1-3)
- Week 2: Implement medium priority features (4-5)
- Week 3: Implement lower priority features (6-7)
- Week 4: Testing, documentation, and release

## Conclusion

By implementing these updates, our KickMCP server will be fully aligned with the latest Kick API features. This will ensure our users have access to the most current functionality and can build robust integrations with the Kick platform.