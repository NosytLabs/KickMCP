# Kick API Webhook Integration Guide

This guide provides detailed information on integrating with Kick's webhook system for real-time notifications.

## Overview

Webhooks allow your application to receive real-time notifications when events occur on Kick. Instead of polling the API for updates, webhooks push data to your application as events happen.

## Supported Events

Kick supports the following webhook events:

| Event Type | Description |
|------------|-------------|
| `stream.online` | Triggered when a channel goes live |
| `stream.offline` | Triggered when a stream ends |
| `follow` | Triggered when a user follows a channel |
| `unfollow` | Triggered when a user unfollows a channel |
| `subscription` | Triggered when a user subscribes to a channel |
| `subscription.end` | Triggered when a subscription expires |
| `chat.message` | Triggered when a chat message is sent |
| `donation` | Triggered when a user donates to a channel |

## Webhook Registration

To receive webhook events, you need to register a webhook endpoint with Kick.

### Prerequisites

1. A publicly accessible HTTPS endpoint that can receive POST requests
2. A Kick API client ID and secret with appropriate permissions
3. A valid access token with webhook management permissions

### Registering a Webhook

```typescript
const webhook = await kickClient.webhook.registerWebhook({
  access_token: 'YOUR_ACCESS_TOKEN',
  url: 'https://your-server.com/webhook',
  events: ['stream.online', 'stream.offline', 'follow'],
  secret: 'your-webhook-secret' // Used for signature verification
});
```

### Managing Webhooks

```typescript
// Get all registered webhooks
const webhooks = await kickClient.webhook.getWebhooks({
  access_token: 'YOUR_ACCESS_TOKEN'
});

// Update a webhook
const updatedWebhook = await kickClient.webhook.updateWebhook({
  access_token: 'YOUR_ACCESS_TOKEN',
  webhook_id: 123,
  events: ['stream.online', 'follow'],
  status: 'active' // or 'disabled'
});

// Delete a webhook
const result = await kickClient.webhook.deleteWebhook({
  access_token: 'YOUR_ACCESS_TOKEN',
  webhook_id: 123
});
```

## Webhook Payload Structure

When an event occurs, Kick will send a POST request to your registered webhook URL with a JSON payload. The payload structure varies depending on the event type, but all payloads include these common fields:

```json
{
  "event": "stream.online",
  "timestamp": "2023-06-15T12:34:56Z",
  "version": "1.0",
  "data": {
    // Event-specific data
  }
}
```

### Example Payloads

#### Stream Online Event

```json
{
  "event": "stream.online",
  "timestamp": "2023-06-15T12:34:56Z",
  "version": "1.0",
  "data": {
    "channel_id": 123456,
    "user_id": 789012,
    "title": "Playing Fortnite!",
    "category_id": 33,
    "category_name": "Fortnite",
    "started_at": "2023-06-15T12:34:50Z"
  }
}
```

#### Follow Event

```json
{
  "event": "follow",
  "timestamp": "2023-06-15T12:45:30Z",
  "version": "1.0",
  "data": {
    "channel_id": 123456,
    "user_id": 345678,
    "username": "new_follower",
    "followed_at": "2023-06-15T12:45:28Z"
  }
}
```

## Webhook Security

To ensure that webhook requests are coming from Kick and not a malicious third party, Kick signs each webhook request with a signature. You should verify this signature before processing the webhook.

### Signature Verification

Kick includes a `Kick-Signature` header with each webhook request. This header contains a HMAC SHA-256 signature of the request body, using your webhook secret as the key.

```typescript
import express from 'express';
import { KickClient } from 'kick-api-client';

const app = express();
const kickClient = new KickClient();

app.post('/webhook', express.json(), (req, res) => {
  // Get the signature from the headers
  const signature = req.headers['kick-signature'];
  
  // Get the raw request body
  const payload = JSON.stringify(req.body);
  
  // Your webhook secret from registration
  const secret = 'your-webhook-secret';
  
  // Verify the signature
  const isValid = kickClient.webhook.verifyWebhookSignature(
    signature as string,
    payload,
    secret
  );
  
  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook event
  const event = req.body.event;
  console.log(`Received ${event} event:`, req.body);
  
  // Process the event using the WebhookService
  kickClient.webhook.processWebhookEvent(event, req.body);
  
  // Always respond with 200 OK to acknowledge receipt
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

## Event Handling with WebhookService

The `WebhookService` provides an event-based system for handling webhook events:

```typescript
// Register event listeners
kickClient.webhook.on('stream.online', (payload) => {
  console.log('Stream went online:', payload);
  // Send notification, update database, etc.
});

kickClient.webhook.on('follow', (payload) => {
  console.log('New follower:', payload);
  // Update follower count, send thank you message, etc.
});

// Listen for all events
kickClient.webhook.on('all', ({ event, payload }) => {
  console.log(`Received ${event} event:`, payload);
  // Generic event logging or processing
});

// One-time event listener
kickClient.webhook.once('subscription', (payload) => {
  console.log('New subscription:', payload);
  // Handle the first subscription event only
});

// Remove event listener
const followHandler = (payload) => {
  console.log('New follower:', payload);
};

kickClient.webhook.on('follow', followHandler);
// Later, when you want to stop listening
kickClient.webhook.off('follow', followHandler);
```

## Best Practices

1. **Respond Quickly**: Webhook endpoints should respond within a few seconds to avoid timeouts.

2. **Verify Signatures**: Always verify webhook signatures to ensure requests are legitimate.

3. **Process Asynchronously**: Acknowledge receipt immediately, then process the webhook data asynchronously.

4. **Handle Duplicates**: Implement idempotency to handle potential duplicate webhook deliveries.

5. **Implement Retry Logic**: If your endpoint is temporarily unavailable, Kick will retry delivery with exponential backoff.

6. **Monitor Webhook Health**: Regularly check that your webhooks are receiving events as expected.

## Troubleshooting

### Common Issues

#### Not Receiving Webhooks

- Verify your webhook URL is publicly accessible
- Check that your server is properly configured to accept POST requests
- Ensure your webhook is registered with the correct events and has 'active' status
- Check server logs for any errors in processing webhook requests

#### Invalid Signature Errors

- Verify you're using the correct webhook secret
- Ensure you're verifying the signature against the raw request body
- Check for any middleware that might modify the request body before verification

#### Rate Limiting

If you receive a high volume of webhook events, you might encounter rate limiting. Consider:

- Implementing a queue system to process events
- Filtering events to only receive those you need
- Optimizing your webhook handler for performance

## Example Implementation

Here's a complete example of a webhook server using Express:

```typescript
import express from 'express';
import { KickClient } from 'kick-api-client';
import { createServer } from 'http';

// Initialize the Kick client
const kickClient = new KickClient();

// Create Express app
const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
  // Verify signature
  const signature = req.headers['kick-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
  
  const isValid = kickClient.webhook.verifyWebhookSignature(
    signature as string,
    payload,
    secret
  );
  
  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook event
  const event = req.body.event;
  console.log(`Received ${event} event:`, req.body);
  
  // Process the event
  kickClient.webhook.processWebhookEvent(event, req.body);
  
  // Acknowledge receipt
  res.status(200).send('OK');
});

// Register event handlers
kickClient.webhook.on('stream.online', (payload) => {
  const { channel_id, title, category_name } = payload.data;
  console.log(`Channel ${channel_id} went live with "${title}" in ${category_name}`);
  
  // Example: Send notification to Discord
  sendDiscordNotification(`🔴 Channel is now live: ${title} (${category_name})`);
});

kickClient.webhook.on('follow', (payload) => {
  const { channel_id, username } = payload.data;
  console.log(`${username} followed channel ${channel_id}`);
  
  // Example: Update follower count in database
  updateFollowerCount(channel_id);
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});

// Example helper functions
function sendDiscordNotification(message: string) {
  // Implementation to send notification to Discord
  console.log(`Discord notification: ${message}`);
}

function updateFollowerCount(channelId: number) {
  // Implementation to update follower count in database
  console.log(`Updating follower count for channel ${channelId}`);
}
```

## Conclusion

Webhooks provide a powerful way to build real-time integrations with Kick. By following this guide, you can implement a robust webhook system that securely processes events from Kick and takes appropriate actions in your application.

For more information, refer to the official Kick API documentation or contact Kick developer support.