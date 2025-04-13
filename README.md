# 🚀 Kick MCP Server [![smithery badge](https://smithery.ai/badge/@NosytLabs/kickmcp)](https://smithery.ai/server/@NosytLabs/kickmcp)

A high-performance Model Context Protocol (MCP) server implementation for the Kick streaming platform API. This server provides a robust, secure, and standardized interface for third-party applications to integrate with Kick's services.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Version](https://img.shields.io/badge/MCP-v1.0-blue.svg)](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker Compatible](https://img.shields.io/badge/docker-compatible-brightgreen.svg)](https://www.docker.com/)

## 📋 Table of Contents

- [Features](#-features)
- [Operating Modes](#-operating-modes)
- [Use Cases](#-use-cases)
- [Quick Start Guide](#-quick-start-guide)
- [Authentication](#-authentication)
- [API Documentation](#-api-documentation)
  - [Authentication Methods](#authentication-methods)
  - [User Methods](#user-methods)
  - [Chat Methods](#chat-methods)
  - [Channel Methods](#channel-methods)
  - [Stream Methods](#stream-methods)
  - [Search and Discovery Methods](#search-and-discovery-methods)
  - [Clip Methods](#clip-methods)
  - [Webhook Methods](#webhook-methods)
- [Configuration](#-configuration)
- [Security Features](#-security-features)
- [Monitoring](#-monitoring)
- [Performance Optimizations](#-performance-optimizations)
- [Debugging](#-debugging)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

## 🌟 Features

### Core Features
- 🔐 **Secure OAuth 2.0 Authentication**
  - Automatic token refresh
  - Scope-based authorization
  - JWT validation
- 🔄 **Real-time Communication**
  - WebSocket support
  - Automatic reconnection
  - Session management
- 🛡️ **Enterprise-grade Security**
  - Rate limiting
  - Request validation
  - CORS protection
- 📊 **Advanced Monitoring**
  - Health checks with detailed metrics
  - Performance tracking
  - CPU and memory monitoring
- 💾 **Caching & Performance**
  - Smart in-memory caching
  - Request optimization
  - Minimal dependencies

### MCP Best Practices
- ✅ Standardized error responses
- ✅ Consistent method naming
- ✅ Proper parameter validation
- ✅ Comprehensive logging
- ✅ Automatic retries
- ✅ Rate limit handling

## 🔄 Operating Modes

The server supports two distinct operating modes:

### 1. MCP Mode (Default)
- Uses JSON-RPC over stdin/stdout
- Compatible with MCP Inspector
- Supports standard MCP protocol methods (`initialize`, `tools/list`, etc.)
- Start with: `npm run mcp` or `npm run mcp:prod`

### 2. HTTP/WebSocket Mode
- Exposes HTTP endpoints and WebSocket connections
- Provides REST API endpoints for tools
- Enables browser-based and HTTP client integrations
- Start with: `npm start` or `npm run dev`

To run the server in HTTP mode for local development or API access, set the `HTTP_MODE` environment variable to `true` or use the provided npm scripts.

## 💡 Use Cases

This MCP server enables a wide range of applications with the Kick API. Here are some practical use cases:

### Chatbots and Moderation
- **AI-Powered Chat Assistant**: Create smart chatbots that can answer viewer questions and provide stream information.
- **Auto-Moderation**: Build custom moderation tools that use AI to detect inappropriate content and take action automatically.
- **Language Translation**: Implement real-time chat translation to make your streams accessible to international audiences.

### Stream Analytics
- **Viewer Engagement Tracking**: Analyze chat activity, viewer count trends, and subscription rates over time.
- **Performance Dashboard**: Build custom dashboards showing real-time metrics about your stream's performance.
- **Competitor Analysis**: Track top-performing streams in your category to identify successful content strategies.

### Community Building
- **Discord Integration**: Sync channel subscriptions and roles between Kick and Discord communities.
- **Custom Alerts**: Create personalized notifications when favorite streamers go live or for special events.
- **Reward Systems**: Implement custom loyalty programs that track viewer engagement across multiple streams.

### Stream Enhancement
- **Interactive Overlays**: Create dynamic stream overlays that respond to chat commands or channel events.
- **Prediction Games**: Build custom prediction systems with automated result tracking.
- **Multi-Stream Management**: Manage multiple channels from a single dashboard for easier content coordination.

### Content Creation
- **Highlight Clips**: Automatically create clips of key moments based on chat activity or stream markers.
- **Social Media Integration**: Auto-post stream notifications, clips, or highlights to social media platforms.
- **Content Scheduling**: Schedule and manage upcoming streams with automatic announcements.

### Revenue Optimization
- **Subscription Analytics**: Track subscription patterns to identify optimal streaming times and content.
- **Gift Tracking**: Monitor gift trends to better understand audience generosity patterns.
- **Advertiser Dashboard**: Create metrics reports for potential channel sponsors and advertisers.

Each of these use cases can be implemented using the MCP server's comprehensive set of tools for interacting with the Kick API in a secure, standardized way.

## 🚀 Quick Start Guide

### Installing via Smithery

To install Kick MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@NosytLabs/kickmcp):

```bash
npx -y @smithery/cli install @NosytLabs/kickmcp --client claude
```

### Prerequisites
- Node.js >= 18.0.0

### 1. Installation

Clone the repository and install dependencies:
```bash
git clone https://github.com/NosytLabs/KickMCP.git
cd KickMCP
npm install
```

### 2. Configuration
Create your environment configuration:
```bash
cp .env.example .env
```

**IMPORTANT**: Open `.env` and set your Kick API key:
```
KICK_API_KEY=your_api_key_here
```

### 3. Start the Server
For MCP mode (recommended for AI integrations):
```bash
npm run mcp
```

For HTTP/WebSocket mode (for web/app integrations):
```bash
npm start
```

### 4. Testing Your Installation
For MCP mode testing:
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/bin/mcp.js
```

For HTTP mode testing:
```bash
curl http://localhost:3000/health
```

### 5. Docker Deployment

Building and running with Docker:

```bash
docker build -t kick-mcp .
docker run -p 3000:3000 -e KICK_API_KEY=your_api_key kick-mcp
```

## 🔐 Authentication

This MCP server implements OAuth 2.0 to authenticate with the Kick API. Here's how the authentication flow works:

### OAuth 2.1 Flow

1. **Register your application**: Obtain a `client_id` and `client_secret` from the Kick developer portal.

2. **Generate PKCE Challenge**: Create a code verifier and code challenge for the PKCE flow.

3. **Authorization Request**: Redirect users to Kick's authorization URL to grant permissions:
   ```
   https://id.kick.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=REQUESTED_SCOPES&state=RANDOM_STATE&code_challenge=CODE_CHALLENGE&code_challenge_method=S256
   ```

4. **Receive Authorization Code**: Kick redirects back to your `redirect_uri` with a `code` parameter.

5. **Exchange Code for Token**: Exchange the code for an access token using the `getAccessToken` method, including the code verifier.

6. **Use Access Token**: Use the access token in subsequent API calls.

7. **Refresh Token**: When the access token expires, use the `refreshAccessToken` method to get a new one.

### App Access Tokens

For accessing public data without user authentication, you can use App Access Tokens:

```json
{
  "jsonrpc": "2.0",
  "method": "getAppAccessToken",
  "params": {
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  },
  "id": 1
}
```

App Access Tokens are suitable for accessing publicly available information that doesn't require user permission.

### Available Scopes

- `user:read` - Read user information (username, streamer ID, etc.)
- `channel:read` - Read channel information (description, category, etc.)
- `channel:write` - Update livestream metadata for a channel
- `chat:write` - Send chat messages and allow chat bots to post in chat
- `streamkey:read` - Read a user's stream URL and stream key
- `events:subscribe` - Subscribe to all channel events (chat messages, follows, subscriptions)

Multiple scopes can be requested by separating them with spaces, e.g., `user:read channel:read`.

## 📚 API Documentation

### Authentication Methods

| Method | Description | Parameters | Notes |
|--------|-------------|------------|-------|
| `getOAuthUrl` | Get OAuth authorization URL | `client_id`: Your application ID<br>`redirect_uri`: URL to redirect after auth<br>`scope`: Space-separated scopes<br>`state`: Random state string<br>`code_challenge`: Code challenge<br>`code_challenge_method`: Code challenge method | Returns a URL that your users should visit to authorize your app |
| `getAccessToken` | Exchange code for token | `client_id`: Your application ID<br>`client_secret`: Your secret key<br>`code`: Auth code from redirect<br>`redirect_uri`: Redirect URI<br>`code_verifier`: Code verifier | Exchange the temporary code for a long-lived access token |
| `refreshAccessToken` | Refresh expired token | `client_id`: Your application ID<br>`client_secret`: Your secret key<br>`refresh_token`: Token for refreshing | Use when access_token expires to get a new one |
| `validateToken` | Validate access token | `access_token`: Token to validate | Check if a token is still valid and get its associated scopes |
| `revokeToken` | Revoke access token | `access_token`: Token to revoke | Immediately invalidate a token for security |
| `getAppAccessToken` | Get app access token | `client_id`: Your application ID<br>`client_secret`: Your secret key | Generate app access token for public data |

**Example: Getting an OAuth URL**
```json
{
  "jsonrpc": "2.0",
  "method": "getOAuthUrl",
  "params": {
    "client_id": "your_client_id",
    "redirect_uri": "https://your-app.com/callback",
    "scope": "user:read channel:read",
    "state": "random_state_string",
    "code_challenge": "your_code_challenge",
    "code_challenge_method": "S256"
  },
  "id": 1
}
```

**Example: Exchanging a code for a token**
```json
{
  "jsonrpc": "2.0",
  "method": "getAccessToken",
  "params": {
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "code": "authorization_code_from_redirect",
    "redirect_uri": "https://your-app.com/callback",
    "code_verifier": "your_code_verifier"
  },
  "id": 2
}
```

### User Methods

| Method | Description | Parameters | Notes |
|--------|-------------|------------|-------|
| `getUserProfile` | Get user profile | `access_token`: User's access token | Returns the authenticated user's profile |
| `updateUserProfile` | Update user profile | `access_token`: User's access token<br>`data`: Object with profile fields | Update user profile information |
| `getUserSubscriptions` | Get subscriptions | `access_token`: User's access token | List channels the user is subscribed to |
| `getUserEmotes` | Get user emotes | `access_token`: User's access token | Emotes the user has access to |
| `getUserBadges` | Get user badges | `access_token`: User's access token | Badges earned by the user |
| `getUserFollows` | Get followed channels | `access_token`: User's access token | Channels the user follows |
| `getUserBlockedUsers` | Get blocked users | `access_token`: User's access token | Users blocked by this user |
| `getUserClips` | Get user clips | `access_token`: User's access token | Clips created by the user |
| `getUserVideos` | Get user videos | `access_token`: User's access token | Videos uploaded by the user |
| `getUserHighlights` | Get user highlights | `access_token`: User's access token | Stream highlights |
| `getUserScheduledStreams` | Get scheduled streams | `access_token`: User's access token | Upcoming streams |
| `getUserNotifications` | Get notifications | `access_token`: User's access token | User's notification feed |
| `getUserWallet` | Get wallet info | `access_token`: User's access token | User's balance and transactions |
| `getUserGifts` | Get gift history | `access_token`: User's access token | Gifts sent and received |

**Example: Getting a user profile**
```json
{
  "jsonrpc": "2.0",
  "method": "getUserProfile",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 3
}
```

### Chat Methods

| Method | Description | Parameters | Notes |
|--------|-------------|------------|-------|
| `getChatMessages` | Get chat messages | `access_token`: User's access token<br>`channel_id`: Channel ID | Recent messages in the channel |
| `sendChatMessage` | Send chat message | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`message`: Message content | Requires `chat:write` scope |
| `getChatSettings` | Get chat settings | `access_token`: User's access token<br>`channel_id`: Channel ID | Chat configuration |
| `banUser` | Ban user from chat | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`user_id`: User to ban | Requires moderator privileges |
| `unbanUser` | Unban user from chat | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`user_id`: User to unban | Requires moderator privileges |
| `timeoutUser` | Timeout user | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`user_id`: User to timeout<br>`duration`: Timeout duration in seconds | Requires moderator privileges |
| `deleteMessage` | Delete chat message | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`message_id`: Message to delete | Requires moderator privileges |
| `clearChat` | Clear all chat messages | `access_token`: User's access token<br>`channel_id`: Channel ID | Requires moderator privileges |
| `getChatUserInfo` | Get chat user info | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`user_id`: User to query | User's chat privileges |

**Example: Sending a chat message**
```json
{
  "jsonrpc": "2.0",
  "method": "sendChatMessage",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "message": "Hello, Kick chat!"
  },
  "id": 4
}
```

### Channel Methods

| Method | Description | Parameters | Notes |
|--------|-------------|------------|-------|
| `getChannelInfo` | Get channel info | `access_token`: User's access token<br>`channel_id`: Channel ID | Basic channel information |
| `getChannelFollowers` | Get followers | `access_token`: User's access token<br>`channel_id`: Channel ID | Users following the channel |
| `getChannelSubscribers` | Get subscribers | `access_token`: User's access token<br>`channel_id`: Channel ID | Requires channel ownership |
| `getChannelEmotes` | Get channel emotes | `access_token`: User's access token<br>`channel_id`: Channel ID | Custom channel emotes |
| `getChannelBadges` | Get channel badges | `access_token`: User's access token<br>`channel_id`: Channel ID | Loyalty and subscriber badges |
| `getChannelModerators` | Get moderators | `access_token`: User's access token<br>`channel_id`: Channel ID | Requires channel ownership |
| `getChannelBans` | Get banned users | `access_token`: User's access token<br>`channel_id`: Channel ID | Requires moderator privileges |
| `getChannelVips` | Get VIP users | `access_token`: User's access token<br>`channel_id`: Channel ID | Users with VIP status |
| `getChannelClips` | Get channel clips | `access_token`: User's access token<br>`channel_id`: Channel ID | Popular clips from channel |
| `getChannelVideos` | Get channel videos | `access_token`: User's access token<br>`channel_id`: Channel ID | VODs and uploads |
| `getChannelHighlights` | Get highlights | `access_token`: User's access token<br>`channel_id`: Channel ID | Highlighted moments |
| `getChannelScheduledStreams` | Get schedule | `access_token`: User's access token<br>`channel_id`: Channel ID | Upcoming streams |
| `getChannelChatRules` | Get chat rules | `access_token`: User's access token<br>`channel_id`: Channel ID | Channel's chat guidelines |
| `getChannelChatCommands` | Get commands | `access_token`: User's access token<br>`channel_id`: Channel ID | Custom chat commands |
| `getChannelCategories` | Get categories | `access_token`: User's access token<br>`channel_id`: Channel ID | Categories used by channel |
| `getChannelTags` | Get channel tags | `access_token`: User's access token<br>`channel_id`: Channel ID | Tags used by the channel |
| `getChannelGifts` | Get gift history | `access_token`: User's access token<br>`channel_id`: Channel ID | Gift transactions |
| `getChannelRaids` | Get raid history | `access_token`: User's access token<br>`channel_id`: Channel ID | Incoming/outgoing raids |
| `getChannelHosts` | Get host history | `access_token`: User's access token<br>`channel_id`: Channel ID | Host events |

**Example: Getting channel information**
```json
{
  "jsonrpc": "2.0",
  "method": "getChannelInfo",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 5
}
```

### Stream Methods

| Method | Description | Parameters | Notes |
|--------|-------------|------------|-------|
| `startStream` | Start streaming | `access_token`: User's access token<br>`channel_id`: Channel ID | Requires `channel:write` scope |
| `endStream` | End stream | `access_token`: User's access token<br>`channel_id`: Channel ID | Requires `channel:write` scope |
| `updateStreamInfo` | Update stream info | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`data`: Stream metadata | Update title, category, etc. |
| `updateStreamSettings` | Update settings | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`data`: Settings object | Technical stream settings |
| `getStreamInfo` | Get stream info | `access_token`: User's access token<br>`channel_id`: Channel ID | Current stream details |
| `getStreamViewers` | Get viewers | `access_token`: User's access token<br>`channel_id`: Channel ID | Current viewer count and list |
| `getStreamCategories` | Get categories | `access_token`: User's access token<br>`channel_id`: Channel ID | Categories of current stream |
| `getStreamTags` | Get stream tags | `access_token`: User's access token<br>`channel_id`: Channel ID | Tags of current stream |
| `getStreamStats` | Get statistics | `access_token`: User's access token<br>`channel_id`: Channel ID | Performance metrics |
| `createPoll` | Create poll | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`title`: Poll title<br>`options`: Array of options<br>`duration`: Duration in seconds | Start a new viewer poll |
| `endPoll` | End active poll | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`poll_id`: Poll to end | End poll early |
| `createPrediction` | Create prediction | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`title`: Prediction title<br>`options`: Array of outcomes<br>`duration`: Duration in seconds | Start a channel prediction |
| `endPrediction` | End prediction | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`prediction_id`: Prediction to end<br>`winning_outcome_id`: Winning outcome | Resolve a prediction |
| `createMarker` | Create stream marker | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`description`: Marker description | Mark a moment for highlights |

**Example: Updating stream information**
```json
{
  "jsonrpc": "2.0",
  "method": "updateStreamInfo",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "data": {
      "title": "New Stream Title",
      "category_id": "789",
      "language": "en",
      "is_mature": false,
      "tags": ["gaming", "fps"]
    }
  },
  "id": 6
}
```

### Search and Discovery Methods

| Method | Description | Parameters | Notes |
|--------|-------------|------------|-------|
| `searchChannels` | Search channels | `query`: Search term<br>`limit`: Max results<br>`page`: Page number | Search for channels |
| `searchStreams` | Search streams | `query`: Search term<br>`limit`: Max results<br>`page`: Page number | Search for live streams |
| `searchUsers` | Search users | `query`: Search term<br>`limit`: Max results<br>`page`: Page number | Search for users |
| `searchCategories` | Search categories | `query`: Search term<br>`limit`: Max results<br>`page`: Page number | Search for categories |
| `getCategories` | Get all categories | `limit`: Max results<br>`page`: Page number | List available categories |
| `getCategory` | Get category details | `category_id`: Category ID | Get specific category |
| `getCategoryStreams` | Get streams in category | `category_id`: Category ID<br>`limit`: Max results<br>`page`: Page number | Streams in a category |
| `getTopStreams` | Get top streams | `limit`: Max results<br>`page`: Page number | Most popular streams |
| `getRecommendedStreams` | Get recommended streams | `access_token`: User's access token<br>`limit`: Max results | Personalized recommendations |
| `getFollowedStreams` | Get followed streams | `access_token`: User's access token<br>`limit`: Max results<br>`page`: Page number | Live streams from followed channels |

**Example: Searching for streams**
```json
{
  "jsonrpc": "2.0",
  "method": "searchStreams",
  "params": {
    "query": "minecraft",
    "limit": 20,
    "page": 1
  },
  "id": 8
}
```

### Clip Methods

| Method | Description | Parameters | Notes |
|--------|-------------|------------|-------|
| `createClip` | Create a clip | `access_token`: User's access token<br>`channel_id`: Channel ID<br>`title`: Clip title | Create highlight clip |
| `getClip` | Get clip details | `clip_id`: Clip ID | View clip information |
| `deleteClip` | Delete a clip | `access_token`: User's access token<br>`clip_id`: Clip ID | Remove clip |
| `updateClip` | Update clip details | `access_token`: User's access token<br>`clip_id`: Clip ID<br>`title`: Updated title | Edit clip metadata |

**Example: Creating a clip**
```json
{
  "jsonrpc": "2.0",
  "method": "createClip",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "title": "Amazing play!"
  },
  "id": 9
}
```

### Webhook Methods

| Method | Description | Parameters | Notes |
|--------|-------------|------------|-------|
| `createWebhook` | Create webhook | `access_token`: User's access token<br>`url`: Webhook endpoint URL<br>`events`: Array of event types | Create notification endpoint |
| `deleteWebhook` | Delete webhook | `access_token`: User's access token<br>`webhook_id`: Webhook to delete | Remove webhook |
| `listWebhooks` | List webhooks | `access_token`: User's access token | Current webhooks |
| `getWebhookEvents` | Get available events | `access_token`: User's access token | Supported event types |
| `verifyWebhookSignature` | Verify signature | `signature`: X-Kick-Signature header<br>`message_id`: Message ID<br>`timestamp`: Event timestamp<br>`body`: Request body | Verify webhook authenticity |
| `getPublicKey` | Get public key | - | Public key for signature verification |
| `getWebhookPayloads` | Get example payloads | `access_token`: User's access token<br>`event_type`: Event to get example for | Example JSON payloads |
| `retryWebhook` | Retry failed webhook | `access_token`: User's access token<br>`webhook_id`: Webhook ID<br>`message_id`: Failed message ID | Retry delivery |
| `checkWebhookSubscriptionStatus` | Check subscription status | `access_token`: User's access token<br>`subscription_id`: Subscription ID | Verify webhook subscription status |

**Example: Creating a webhook**
```json
{
  "jsonrpc": "2.0",
  "method": "createWebhook",
  "params": {
    "access_token": "user_access_token",
    "url": "https://your-server.com/webhooks/kick",
    "events": ["stream.online", "stream.offline", "follow"]
  },
  "id": 7
}
```

## 🔐 Configuration

### Essential Environment Variables
```env
# REQUIRED: Your Kick API key (must be set for functionality)
KICK_API_KEY=your_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info # error, warn, info, debug
HTTP_MODE=false # true for HTTP server, false for MCP mode

# Performance Settings
API_TIMEOUT=10000 # API request timeout in ms
RATE_LIMIT=60 # Requests per minute
RATE_LIMIT_WINDOW=60000 # Rate limit window in ms

# Kick API Base URL (usually doesn't need changing)
KICK_API_BASE_URL=https://kick.com/api/v2
```

## 🔒 Security Features

### Rate Limiting
- Built-in sliding window rate limiter
- Configurable windows and limits
- IP and path-based rate limiting

### Request Validation
- Parameter validation
- Payload integrity checks
- Access token verification

## 📊 Monitoring

### Health Check Endpoint
```bash
GET /health
```

This endpoint returns:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2023-04-15T12:34:56Z",
  "uptime": 3600,
  "environment": {
    "node": "v18.18.0",
    "env": "production"
  },
  "memory": {
    "rss": "56MB",
    "heapTotal": "32MB",
    "heapUsed": "28MB",
    "external": "2MB"
  },
  "websocket": {
    "connected": 5
  },
  "api": {
    "status": "ok",
    "baseUrl": "https://kick.com/api/v2"
  }
}
```

## 🚀 Performance Optimizations

### Efficient Caching
- Custom in-memory cache implementation
- Automatic cache cleanup to prevent memory leaks
- Selective endpoint caching

### Dependency Minimization
- Reduced external dependencies
- Native Node.js modules where possible
- Smaller installation footprint

### HTTP Optimizations
- Native Node.js HTTP server
- Efficient request body parsing
- Optimized WebSocket communication

## 🔍 Debugging

### Logging Levels
```json
{
  "error": 0,
  "warn": 1,
  "info": 2,
  "debug": 3
}
```

### Debug Mode
Enable debug output:
```env
LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please ensure your code follows our coding standards and includes tests for new functionality.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

* [Kick API Documentation](https://docs.kick.com)
* [Model Context Protocol](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
* [Smithery](https://smithery.ai/) - MCP Server Deployment Platform

---

Made with ❤️ by [NosytLabs](https://github.com/NosytLabs)  
*Notable Opportunities Shape Your Tomorrow!* | [NosytLabs.com](https://nosytlabs.com)  
Follow us on [YouTube](https://www.youtube.com/user/tycenyt)
