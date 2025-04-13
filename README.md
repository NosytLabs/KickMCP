# 🚀 Kick MCP Server [![smithery badge](https://smithery.ai/badge/@NosytLabs/kickmcp)](https://smithery.ai/server/@NosytLabs/kickmcp)

A high-performance Model Context Protocol (MCP) server implementation for the Kick streaming platform API. This server provides a robust, secure, and standardized interface for AI models to interact with Kick's services.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Version](https://img.shields.io/badge/MCP-v1.0-blue.svg)](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker Compatible](https://img.shields.io/badge/docker-compatible-brightgreen.svg)](https://www.docker.com/)

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Quick Start

### Option 1: Using Smithery (Recommended)
The easiest way to get started is using Smithery. Just run:
```bash
npx -y @smithery/cli install @NosytLabs/kickmcp --client claude
```
This will:
- Install the server
- Set up all required configurations
- Start the server automatically
- No OAuth credentials required - Smithery handles authentication automatically

### Option 2: Manual Installation
1. Clone the repository:
```bash
git clone https://github.com/NosytLabs/KickMCP.git
cd KickMCP
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm run mcp
```

## 🌟 Features

- 🔐 **Secure OAuth 2.0 Authentication**
- 🔄 **Real-time Communication**
- 🛡️ **Enterprise-grade Security**
- 📊 **Advanced Monitoring**
- 💾 **Smart Caching**

## 📥 Installation

### Prerequisites
- Node.js 18 or higher
- Git (for manual installation)

### Using Smithery
1. Install the Smithery CLI:
```bash
npm install -g @smithery/cli
```

2. Install the server:
```bash
smithery install @NosytLabs/kickmcp
```

3. Start using it immediately - no configuration needed! Smithery handles all authentication automatically.

### Manual Installation
1. Clone the repository
2. Install dependencies
3. Copy `.env.example` to `.env`
4. Start the server

## ⚙️ Configuration

### Required Settings (Manual Installation Only)
Only needed for manual installation:
```env
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
```

### Optional Settings
```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
WEBHOOK_URL=
WEBHOOK_SECRET=
```

## 🚀 Usage

### Starting the Server
```bash
# Development mode
npm run dev

# Production mode
npm run mcp:prod

# HTTP mode
npm start
```

### Testing Your Setup
```bash
curl http://localhost:3000/health
```

## 📚 API Documentation

### Authentication
```json
{
  "jsonrpc": "2.0",
  "method": "getOAuthUrl",
  "params": {
    "client_id": "your_client_id",
    "redirect_uri": "http://localhost:3000/auth/callback",
    "scope": "user:read channel:read"
  },
  "id": 1
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Server won't start**
   - Check Node.js version (must be 18 or higher)
   - Ensure all dependencies are installed
   - Check port availability

2. **Authentication errors**
   - If using Smithery: No action needed - authentication is handled automatically
   - If manual installation: Verify OAuth credentials
   - Check redirect URI configuration
   - Ensure proper scopes are requested

3. **Rate limiting**
   - Implement proper error handling
   - Use exponential backoff
   - Monitor API usage

### Getting Help
- Check the [issues](https://github.com/NosytLabs/KickMCP/issues) page
- Join our [Discord](https://discord.gg/nosylabs)
- Contact support at support@nosylabs.com

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Smithery](https://smithery.ai/) for the deployment platform
- [Kick](https://kick.com/) for the API
- [Node.js](https://nodejs.org/) for the runtime
- [Docker](https://www.docker.com/) for containerization
