# 🚀 Kick MCP Server

A high-performance Model Context Protocol (MCP) server implementation for the Kick streaming platform API. This server provides a robust, secure, and standardized interface for third-party applications to integrate with Kick's services.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Version](https://img.shields.io/badge/MCP-v1.0-blue.svg)](https://modelcontextprotocol.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen.svg)](https://docs.docker.com/)

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
  - IP whitelisting
  - Request signing
  - CORS protection
- 📊 **Advanced Monitoring**
  - Prometheus metrics
  - Health checks
  - Performance tracking
- 💾 **Caching & Performance**
  - Redis support
  - In-memory caching
  - Request optimization

### MCP Best Practices
- ✅ Standardized error responses
- ✅ Consistent method naming
- ✅ Proper parameter validation
- ✅ Comprehensive logging
- ✅ Automatic retries
- ✅ Rate limit handling

## 📚 API Documentation

### Authentication Methods
| Method | Description | Parameters |
|--------|-------------|------------|
| `getOAuthUrl` | Get OAuth authorization URL | `client_id`, `redirect_uri`, `scope` |
| `getAccessToken` | Exchange code for token | `client_id`, `client_secret`, `code` |
| `refreshAccessToken` | Refresh expired token | `client_id`, `client_secret`, `refresh_token` |
| `validateToken` | Validate access token | `access_token` |
| `revokeToken` | Revoke access token | `access_token` |

### User Methods
| Method | Description | Parameters |
|--------|-------------|------------|
| `getUserProfile` | Get user profile | `access_token` |
| `updateUserProfile` | Update user profile | `access_token`, `data` |
| `getUserSubscriptions` | Get subscriptions | `access_token` |
| `getUserEmotes` | Get user emotes | `access_token` |
| `getUserBadges` | Get user badges | `access_token` |
| `getUserFollows` | Get followed channels | `access_token` |
| `getUserBlockedUsers` | Get blocked users | `access_token` |
| `getUserClips` | Get user clips | `access_token` |
| `getUserVideos` | Get user videos | `access_token` |
| `getUserHighlights` | Get user highlights | `access_token` |
| `getUserScheduledStreams` | Get scheduled streams | `access_token` |
| `getUserNotifications` | Get notifications | `access_token` |
| `getUserWallet` | Get wallet info | `access_token` |
| `getUserGifts` | Get gift history | `access_token` |

### Chat Methods
| Method | Description | Parameters |
|--------|-------------|------------|
| `getChatMessages` | Get chat messages | `access_token`, `channel_id` |
| `sendChatMessage` | Send chat message | `access_token`, `channel_id`, `message` |
| `getChatSettings` | Get chat settings | `access_token`, `channel_id` |
| `banUser` | Ban user from chat | `access_token`, `channel_id`, `user_id` |
| `unbanUser` | Unban user from chat | `access_token`, `channel_id`, `user_id` |
| `timeoutUser` | Timeout user | `access_token`, `channel_id`, `user_id`, `duration` |
| `deleteMessage` | Delete chat message | `access_token`, `channel_id`, `message_id` |
| `clearChat` | Clear all chat messages | `access_token`, `channel_id` |
| `getChatUserInfo` | Get chat user info | `access_token`, `channel_id`, `user_id` |

### Channel Methods
| Method | Description | Parameters |
|--------|-------------|------------|
| `getChannelInfo` | Get channel info | `access_token`, `channel_id` |
| `getChannelFollowers` | Get followers | `access_token`, `channel_id` |
| `getChannelSubscribers` | Get subscribers | `access_token`, `channel_id` |
| `getChannelEmotes` | Get channel emotes | `access_token`, `channel_id` |
| `getChannelBadges` | Get channel badges | `access_token`, `channel_id` |
| `getChannelModerators` | Get moderators | `access_token`, `channel_id` |
| `getChannelBans` | Get banned users | `access_token`, `channel_id` |
| `getChannelVips` | Get VIP users | `access_token`, `channel_id` |
| `getChannelClips` | Get channel clips | `access_token`, `channel_id` |
| `getChannelVideos` | Get channel videos | `access_token`, `channel_id` |
| `getChannelHighlights` | Get highlights | `access_token`, `channel_id` |
| `getChannelScheduledStreams` | Get schedule | `access_token`, `channel_id` |
| `getChannelChatRules` | Get chat rules | `access_token`, `channel_id` |
| `getChannelChatCommands` | Get commands | `access_token`, `channel_id` |
| `getChannelCategories` | Get categories | `access_token`, `channel_id` |
| `getChannelTags` | Get channel tags | `access_token`, `channel_id` |
| `getChannelGifts` | Get gift history | `access_token`, `channel_id` |
| `getChannelRaids` | Get raid history | `access_token`, `channel_id` |
| `getChannelHosts` | Get host history | `access_token`, `channel_id` |

### Stream Methods
| Method | Description | Parameters |
|--------|-------------|------------|
| `startStream` | Start streaming | `access_token`, `channel_id` |
| `endStream` | End stream | `access_token`, `channel_id` |
| `updateStreamInfo` | Update stream info | `access_token`, `channel_id`, `data` |
| `updateStreamSettings` | Update settings | `access_token`, `channel_id`, `data` |
| `getStreamInfo` | Get stream info | `access_token`, `channel_id` |
| `getStreamViewers` | Get viewers | `access_token`, `channel_id` |
| `getStreamCategories` | Get categories | `access_token`, `channel_id` |
| `getStreamTags` | Get stream tags | `access_token`, `channel_id` |
| `getStreamStats` | Get statistics | `access_token`, `channel_id` |
| `createPoll` | Create poll | `access_token`, `channel_id`, `title`, `options`, `duration` |
| `endPoll` | End active poll | `access_token`, `channel_id`, `poll_id` |
| `createPrediction` | Create prediction | `access_token`, `channel_id`, `title`, `options`, `duration` |
| `endPrediction` | End prediction | `access_token`, `channel_id`, `prediction_id`, `winning_outcome_id` |
| `createMarker` | Create stream marker | `access_token`, `channel_id`, `description` |

### Webhook Methods
| Method | Description | Parameters |
|--------|-------------|------------|
| `createWebhook` | Create webhook | `access_token`, `url`, `events` |
| `deleteWebhook` | Delete webhook | `access_token`, `webhook_id` |
| `listWebhooks` | List webhooks | `access_token` |
| `getWebhookEvents` | Get available events | `access_token` |
| `verifyWebhookSignature` | Verify signature | `signature`, `message_id`, `timestamp`, `body` |
| `getPublicKey` | Get public key | - |
| `getWebhookPayloads` | Get example payloads | `access_token`, `event_type` |
| `retryWebhook` | Retry failed webhook | `access_token`, `webhook_id`, `message_id` |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Redis (optional, for enhanced caching)
- Docker (optional, for containerization)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NosytLabs/KickMCP.git
cd KickMCP
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start the server:
```bash
npm start
```

### Docker Deployment
```bash
# Build image
docker build -t kick-mcp .

# Run container
docker run -p 3000:3000 \
  -e KICK_API_KEY=your_api_key \
  -e PORT=3000 \
  kick-mcp
```

## ⚙️ Configuration

### Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
ALLOWED_ORIGINS=https://example.com,https://api.example.com
IP_WHITELIST=127.0.0.1,192.168.1.100
REQUIRE_SIGNATURE=true
SIGNATURE_SECRET=your-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Kick API
KICK_API_BASE_URL=https://kick.com/api/v2
```

## 🔒 Security Features

### Rate Limiting
- Configurable windows and limits
- Redis-based distributed rate limiting
- Per-endpoint customization

### Request Validation
- HMAC signature verification
- Timestamp validation
- Payload integrity checks

### Access Control
- IP whitelisting
- Origin validation
- Scope-based authorization

## 📊 Monitoring

### Prometheus Metrics
- Request duration histograms
- Error rate tracking
- WebSocket connection stats
- Cache hit ratios

### Health Checks
```bash
GET /health
```
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 1234567,
  "redis": {
    "status": "ok",
    "connected": true
  },
  "memory": {
    "total": 1024,
    "used": 512
  }
}
```

## 🔍 Debugging

### Logging Levels
```javascript
{
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}
```

### Debug Mode
```env
DEBUG=kick-mcp:*
LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Kick API Documentation](https://kick.com/api/docs)
- [Model Context Protocol](https://modelcontextprotocol.com)
- [Smithery](https://smithery.dev)

---

Made with ❤️ by [NosytLabs](https://github.com/NosytLabs)
