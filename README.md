# Kick MCP Server

A Model Context Protocol server implementation for the Kick API, providing a comprehensive interface for interacting with Kick's streaming platform.

## Features

- Complete coverage of Kick API endpoints
- WebSocket and HTTP support
- OAuth2 authentication
- Rate limiting with Redis support
- Caching with in-memory and Redis options
- Comprehensive security features
- Prometheus metrics and monitoring
- Health check endpoint
- Detailed logging and error handling

## Requirements

- Node.js >= 18.0.0
- Redis (optional, for rate limiting and caching)

## Installation

```bash
npm install
```

## Configuration

The server can be configured using environment variables. Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
ALLOWED_ORIGINS=https://example.com,https://api.example.com
IP_WHITELIST=127.0.0.1,192.168.1.100
REQUIRE_SIGNATURE=true
SIGNATURE_SECRET=your-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Kick API
KICK_API_BASE_URL=https://kick.com/api/v2
```

## Security Features

### CORS Protection
- Configurable allowed origins
- Restricted HTTP methods
- Controlled header access

### IP Whitelisting
- Restrict access to specific IP addresses
- Optional feature, disabled by default

### Request Signing
- Verify request authenticity
- HMAC-SHA256 signature validation
- Optional feature, disabled by default

### Additional Security
- Helmet middleware for HTTP headers
- Rate limiting protection
- Input validation
- Parameter sanitization

## Monitoring and Metrics

### Prometheus Metrics
- Default Node.js metrics
- Custom HTTP request metrics
- Request duration tracking
- Error rate monitoring

### Health Check
- Server status monitoring
- Redis connection status
- Memory usage statistics
- Session count tracking

## API Documentation

### OAuth Endpoints
- `GET /oauth/authorize` - Get OAuth authorization URL
- `POST /oauth/token` - Get access token
- `POST /oauth/refresh` - Refresh access token

### User Endpoints
- `GET /users/me` - Get user profile
- `PATCH /users/me` - Update user profile
- `GET /users/me/subscriptions` - Get user subscriptions
- (Additional user endpoints documented in the code)

### Chat Endpoints
- `GET /channels/:channel_id/chat` - Get chat messages
- `POST /channels/:channel_id/chat` - Send chat message
- `GET /channels/:channel_id/chat/settings` - Get chat settings
- (Additional chat endpoints documented in the code)

### Channel Endpoints
- `GET /channels/:channel_id` - Get channel information
- `GET /channels/:channel_id/followers` - Get channel followers
- `GET /channels/:channel_id/subscribers` - Get channel subscribers
- (Additional channel endpoints documented in the code)

### Stream Endpoints
- `GET /channels/:channel_id/stream` - Get stream information
- `POST /channels/:channel_id/stream/start` - Start stream
- `POST /channels/:channel_id/stream/end` - End stream
- (Additional stream endpoints documented in the code)

### Webhook Endpoints
- `POST /webhooks` - Create webhook subscription
- `DELETE /webhooks/:webhook_id` - Delete webhook subscription
- `GET /webhooks` - List webhook subscriptions
- (Additional webhook endpoints documented in the code)

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test
```

## Deployment

The server can be deployed using Docker:

```bash
docker build -t kick-mcp .
docker run -p 3000:3000 kick-mcp
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License - see LICENSE file for details

## 🏆 Kick Bounties Submission

This project is submitted for the [Kick Bounties Program](https://dev.kick.com/bounties) to improve the developer experience and security of Kick API integrations.

## 🙏 Acknowledgments

- [Kick API](https://dev.kick.com)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Smithery](https://smithery.ai)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Made with ❤️ by [NosytLabs](https://github.com/NosytLabs)
