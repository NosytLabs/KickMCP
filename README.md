# 🎮 KickMCP - Kick API Integration Made Easy

[![npm version](https://img.shields.io/npm/v/kick-mcp.svg)](https://www.npmjs.com/package/kick-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> 🚀 A powerful Model Context Protocol (MCP) server for seamless Kick.com API integration

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [User Guides](#-user-guides)
  - [For Viewers](#-for-viewers)
  - [For Streamers](#-for-streamers)
  - [For Developers](#-for-developers)
- [Installation](#-installation)
- [Authentication Setup](#-authentication-setup)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Quick Start

1. Install the package:
```bash
npm install kick-mcp
```

2. Create your MCP configuration (mcp.json):
```json
{
  "mcpServers": {
    "kickmcp": {
      "command": "node",
      "args": ["./dist/bin/mcp.js"]
    }
  },
  "version": "1.0.0",
  "description": "MCP configuration for KickMCP project",
  "defaultServer": "kickmcp"
```

3. Get your credentials:
- Visit [Kick Developer Settings](https://kick.com/settings/developer) to obtain your Client ID
- Get your Smithery key from [Smithery.ai](https://smithery.ai/server/@NosytLabs/kickmcp)

## ✨ Features

- **Complete Kick API Integration**:
  - Authentication (OAuth, App Access Tokens)
  - Chat messaging with reply support
  - Channel information by ID and slug
  - User profile management
  - Stream control (start/stop/update)
  - Polls and predictions
  - Livestream status webhooks
  - Category search and trending content

- **MCP Standard Compliance**:
  - JSON-RPC 2.0 interface
  - Standardized authentication
  - Extensible endpoints
  - AI assistant compatibility

- **Developer Experience**:
  - Modern TypeScript codebase
  - Comprehensive documentation
  - Built-in diagnostics
  - Consistent error handling

## 👥 User Guides

### 👀 For Viewers

Enhance your viewing experience with KickMCP:

- **Chat Integration**: Build custom chat clients with real-time message support
- **Channel Notifications**: Get alerts when your favorite streamers go live
- **Content Discovery**: Find new channels and trending categories

Example: Setting up chat notifications
```typescript
const kickmcp = require('kick-mcp');

kickmcp.on('chatMessage', (message) => {
  if (message.mentions.includes(yourUsername)) {
    sendNotification(`${message.sender} mentioned you!`);
  }
});
```

### 🎥 For Streamers

Optimize your streaming workflow:

- **Stream Management**: Control your stream settings programmatically
- **Chat Moderation**: Build custom moderation tools
- **Analytics**: Track viewer engagement and channel growth
- **Polls & Predictions**: Create interactive content

Example: Creating a poll
```typescript
const poll = await kickmcp.createPoll({
  question: "What game next?",
  options: ["Minecraft", "Fortnite", "Valorant"],
  duration: 300 // 5 minutes
});
```

### 💻 For Developers

Build powerful Kick.com integrations:

- **OAuth Authentication**: Secure user authentication flow
- **Webhooks**: Real-time event processing
- **RESTful API**: Complete API coverage
- **TypeScript Support**: Full type definitions

Example: Setting up webhooks
```typescript
const webhook = await kickmcp.createWebhook({
  events: ['stream.online', 'stream.offline'],
  url: 'https://your-server.com/webhook'
});
```

## 🔧 Installation

```bash
npm install kick-mcp

# or with yarn
yarn add kick-mcp
```

## 🔑 Authentication Setup

1. Visit [Kick Developer Settings](https://kick.com/settings/developer)
2. Create a new application
3. Copy your Client ID and Client Secret
4. Configure your MCP server:

```typescript
const kickmcp = require('kick-mcp');

kickmcp.configure({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET'
});
```

## 📚 API Documentation

For detailed API documentation, visit:
- [Kick API Documentation](https://kick.com/api/docs)
- [KickMCP TypeDoc](https://nosytlabs.github.io/KickMCP/)

## 🔍 Troubleshooting

Common issues and solutions:

1. **Authentication Errors**
   - Verify your Client ID and Secret
   - Check your OAuth redirect URI
   - Ensure your Smithery key is valid

2. **Rate Limiting**
   - Implement proper request throttling
   - Use caching where appropriate
   - Monitor your API usage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [NosytLabs](https://github.com/NosytLabs)
