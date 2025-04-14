# 🚀 Kick MCP Server [![smithery badge](https://smithery.ai/badge/@NosytLabs/kickmcp)](https://smithery.ai/server/@NosytLabs/kickmcp)

<div align="center">
  
> **Notable Opportunities Shape Your Tomorrow | Nosyt Labs**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Version](https://img.shields.io/badge/MCP-v1.0-blue.svg)](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker Compatible](https://img.shields.io/badge/docker-compatible-brightgreen.svg)](https://www.docker.com/)
[![Topics](https://img.shields.io/badge/topics-kick,api,integration,ai,streaming-blue.svg)](https://github.com/NosytLabs/KickMCP)

</div>

<details>
<summary>📋 Table of Contents</summary>

- [Project Overview](#-project-overview)
- [Quick Start](#-quick-start)
- [Getting Started with Kick](#-getting-started-with-kick)
- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Developer Guide](#-developer-guide)
- [MCP Methods](#-mcp-methods)
- [Use Cases](#-use-cases)
- [AI Integration](#-ai-integration)
- [Development](#-development)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

</details>

<details>
<summary>🎯 Project Overview</summary>

The Kick MCP Server is an unofficial integration tool that enables AI models to interact with Kick's platform through a standardized interface. It provides access to all 80+ Kick API endpoints, making it easier for developers to build AI-powered features for streamers and viewers.

### Key Features
- Complete Kick API coverage (80+ endpoints)
- Secure OAuth 2.0 authentication
- Real-time event handling
- Built-in rate limiting and error handling
- Easy integration with AI models

### Important Note
This is an unofficial project and is not affiliated with or endorsed by Kick. Use at your own risk. The API endpoints and functionality may change without notice.

</details>

<details>
<summary>🚀 Quick Start</summary>

### Option 1: Using Smithery (Recommended)
The easiest way to get started is using Smithery. Here's a detailed guide:

1. **Install Smithery CLI**:
```bash
npm install -g @smithery/cli
```

2. **Initialize Smithery**:
```bash
smithery init
```

3. **Configure Smithery**:
```bash
# Set your Kick credentials
smithery config set KICK_CLIENT_ID your_client_id
smithery config set KICK_CLIENT_SECRET your_client_secret

# Set your preferred AI model
smithery config set AI_MODEL claude-3-opus-20240229

# Set your preferred logging level
smithery config set LOG_LEVEL info
```

4. **Install the MCP Server**:
```bash
smithery install @NosytLabs/kickmcp
```

5. **Start Using the Tools**:
```bash
# Example: Get OAuth URL
smithery run @NosytLabs/kickmcp getOAuthUrl

# Example: Get Access Token
smithery run @NosytLabs/kickmcp getAccessToken --code your_auth_code

# Example: Send Chat Message
smithery run @NosytLabs/kickmcp sendChatMessage --channel_id 123 --message "Hello!"
```

<details>
<summary>🔑 Access Token Management</summary>

### Getting an Access Token
1. **Get OAuth URL**:
```bash
smithery run @NosytLabs/kickmcp getOAuthUrl
```

2. **Authorize Application**:
- Visit the returned URL in your browser
- Log in to your Kick account
- Grant the requested permissions
- Copy the authorization code from the redirect URL

3. **Exchange Code for Token**:
```bash
smithery run @NosytLabs/kickmcp getAccessToken --code your_auth_code
```

4. **Store Token Securely**:
```bash
# Store token in Smithery's secure storage
smithery config set ACCESS_TOKEN your_access_token
```

### Token Refresh
```bash
# Automatically refresh expired tokens
smithery run @NosytLabs/kickmcp refreshAccessToken

# Manually refresh token
smithery run @NosytLabs/kickmcp refreshAccessToken --refresh_token your_refresh_token
```

### Token Validation
```bash
# Validate token
smithery run @NosytLabs/kickmcp validateToken --access_token your_access_token
```

</details>

<details>
<summary>🛠️ Tool Usage Guide</summary>

### Authentication Tools
```bash
# Get OAuth URL
smithery run @NosytLabs/kickmcp getOAuthUrl

# Get Access Token
smithery run @NosytLabs/kickmcp getAccessToken --code your_auth_code

# Refresh Token
smithery run @NosytLabs/kickmcp refreshAccessToken

# Validate Token
smithery run @NosytLabs/kickmcp validateToken
```

### Chat Tools
```bash
# Send Message
smithery run @NosytLabs/kickmcp sendChatMessage --channel_id 123 --message "Hello!"

# Get Chat Messages
smithery run @NosytLabs/kickmcp getChatMessages --channel_id 123

# Moderate Chat
smithery run @NosytLabs/kickmcp timeoutUser --channel_id 123 --user_id 456 --duration 300
```

### Stream Tools
```bash
# Get Stream Info
smithery run @NosytLabs/kickmcp getStreamInfo --channel_id 123

# Update Stream Title
smithery run @NosytLabs/kickmcp updateStreamInfo --channel_id 123 --title "New Title"

# Get Stream Viewers
smithery run @NosytLabs/kickmcp getStreamViewers --channel_id 123
```

### Analytics Tools
```bash
# Get Stream Stats
smithery run @NosytLabs/kickmcp getStreamStats --channel_id 123

# Get Chat Metrics
smithery run @NosytLabs/kickmcp getChatMetrics --channel_id 123

# Get Viewer Analytics
smithery run @NosytLabs/kickmcp getViewerAnalytics --channel_id 123
```

### AI Integration Tools
```bash
# Analyze Chat Sentiment
smithery run @NosytLabs/kickmcp analyzeChatSentiment --channel_id 123

# Get Content Recommendations
smithery run @NosytLabs/kickmcp getRecommendations --user_id 456

# Create Smart Highlights
smithery run @NosytLabs/kickmcp createSmartHighlight --channel_id 123 --duration 60
```

### Webhook Tools
```bash
# Create Webhook
smithery run @NosytLabs/kickmcp createWebhook --url https://your-webhook-url.com --events stream.online,chat.message

# List Webhooks
smithery run @NosytLabs/kickmcp listWebhooks

# Delete Webhook
smithery run @NosytLabs/kickmcp deleteWebhook --webhook_id 123
```

### Channel Management Tools
```bash
# Emote Management
smithery run @NosytLabs/kickmcp createChannelEmote --channel_id 123 --name "pepeHappy" --image_url "https://example.com/emote.png"
smithery run @NosytLabs/kickmcp deleteChannelEmote --channel_id 123 --emote_id 456

# Badge Management
smithery run @NosytLabs/kickmcp createChannelBadge --channel_id 123 --name "VIP" --image_url "https://example.com/badge.png"
smithery run @NosytLabs/kickmcp deleteChannelBadge --channel_id 123 --badge_id 456

# VIP Management
smithery run @NosytLabs/kickmcp addChannelVIP --channel_id 123 --user_id 456
smithery run @NosytLabs/kickmcp removeChannelVIP --channel_id 123 --user_id 456

# Moderator Management
smithery run @NosytLabs/kickmcp addChannelModerator --channel_id 123 --user_id 456
smithery run @NosytLabs/kickmcp removeChannelModerator --channel_id 123 --user_id 456

# Chat Commands
smithery run @NosytLabs/kickmcp createChatCommand --channel_id 123 --command "!hello" --response "Welcome to the stream!"
smithery run @NosytLabs/kickmcp updateChatCommand --channel_id 123 --command_id 456 --response "New welcome message!"
smithery run @NosytLabs/kickmcp deleteChatCommand --channel_id 123 --command_id 456
```

### Stream Management Tools
```bash
# Poll Management
smithery run @NosytLabs/kickmcp getPollResults --channel_id 123 --poll_id 456

# Prediction Management
smithery run @NosytLabs/kickmcp getPredictionResults --channel_id 123 --prediction_id 456

# Stream Markers
smithery run @NosytLabs/kickmcp getStreamMarkers --channel_id 123 --start_time "2024-03-01" --end_time "2024-03-31"

# Raid Management
smithery run @NosytLabs/kickmcp startRaid --channel_id 123 --target_channel_id 456
smithery run @NosytLabs/kickmcp cancelRaid --channel_id 123 --raid_id 456

# Host Management
smithery run @NosytLabs/kickmcp startHost --channel_id 123 --target_channel_id 456
smithery run @NosytLabs/kickmcp endHost --channel_id 123 --host_id 456
```

</details>

</details>

<details>
<summary>🎮 Getting Started with Kick</summary>

### 1. Create a Kick Account
1. Visit [Kick.com](https://kick.com)
2. Click "Sign Up" and create your account
3. Complete your profile setup

### 2. Get Your API Credentials
1. Log in to your Kick account
2. Go to [Kick Developer Portal](https://kick.com/developer)
3. Click "Create New Application"
4. Fill in the application details:
   - Name: Your app name
   - Description: Brief description
   - Redirect URI: `http://localhost:3000/auth/callback` (for development)
5. Save your credentials:
   - Client ID
   - Client Secret

### 3. Set Up Your Development Environment
1. Create a `.env` file in your project root:
```env
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

2. Install required tools:
```bash
# Install Node.js (if not already installed)
# Windows: Download from https://nodejs.org/
# Mac: brew install node
# Linux: sudo apt install nodejs

# Install Git (if not already installed)
# Windows: Download from https://git-scm.com/
# Mac: brew install git
# Linux: sudo apt install git
```

</details>

<details>
<summary>🌟 Features</summary>

### Core Features
- 🔐 **Secure OAuth 2.0 Authentication**
  - PKCE support
  - Token refresh
  - Token validation
  - Token revocation
- 🔄 **Real-time Communication**
  - WebSocket support
  - Event-driven architecture
  - Low latency updates
- 🛡️ **Enterprise-grade Security**
  - Rate limiting
  - Input validation
  - Error handling
  - Logging
- 📊 **Advanced Monitoring**
  - Performance metrics
  - Error tracking
  - Usage analytics
- 💾 **Smart Caching**
  - Response caching
  - Token caching
  - Resource optimization

### API Features
- **Authentication**
  - OAuth 2.0 flow
  - Token management
  - Session handling
- **User Management**
  - Profile management
  - Preferences
  - Statistics
- **Channel Operations**
  - Stream management
  - Chat control
  - Moderation
- **Content Management**
  - Clips
  - Highlights
  - Videos
- **Community Features**
  - Followers
  - Subscribers
  - VIPs
  - Moderators

### Advanced Features
- **AI Integration**
  - Chat analysis
  - Content recommendations
  - Automated moderation
- **Analytics**
  - Viewer statistics
  - Chat metrics
  - Revenue tracking
- **Automation**
  - Stream scheduling
  - Chat commands
  - Event triggers
- **Integration**
  - Webhooks
  - Third-party services
  - Custom extensions

</details>

<details>
<summary>💡 Use Cases</summary>

<div align="center">

| For Streamers | For Viewers | For Developers |
|--------------|-------------|----------------|
| Stream Management & Automation | Enhanced Viewing Experience | Chat Bot Development |
| Viewer Engagement & Rewards | Community Interaction | Analytics & Insights |
| Content Creation & Highlights | Content Discovery | Integration Development |
| Advanced Moderation | Chat Enhancement | Custom Features |
| Revenue Optimization | Stream Notifications | Webhook Integration |

</div>

<details>
<summary>For Streamers</summary>

```typescript
// Stream Management Example
const streamManager = new StreamManager({
  access_token: "your_token",
  channel_id: "your_channel"
});

// Schedule recurring streams
streamManager.scheduleRecurring({
  days: ["Monday", "Wednesday", "Friday"],
  time: "20:00",
  duration: 180
});
```

</details>

<details>
<summary>For Viewers</summary>

```typescript
// Enhanced Viewing Example
const viewer = new EnhancedViewer({
  access_token: "your_token",
  channel_id: "favorite_channel"
});

// Setup custom notifications
viewer.setupNotifications({
  streamStart: true,
  host: true,
  raid: true
});
```

</details>

<details>
<summary>For Developers</summary>

```typescript
// Chat Bot Example
const bot = new AdvancedBot({
  access_token: "your_token",
  channel_id: "target_channel"
});

// Add custom commands
bot.addCommand({
  name: "!stats",
  handler: async (user) => {
    const stats = await getUserStats(user.id);
    return `Viewer Stats: ${stats.hoursWatched} hours watched`;
  }
});
```

</details>

</details>

<details>
<summary>🤖 AI Integration</summary>

### Chat Sentiment Analysis
```typescript
const sentiment = new ChatSentiment({
  access_token: "your_token",
  channel_id: "target_channel"
});

sentiment.onMessage(async (message) => {
  const analysis = await analyzeSentiment(message.content);
  if (analysis.sentiment === "negative") {
    await sendModAlert(message);
  }
});
```

### Content Recommendations
```typescript
const recommender = new ContentRecommender({
  access_token: "your_token"
});

recommender.getRecommendations({
  viewerHistory: userHistory,
  preferences: userPreferences
}).then(recommendations => {
  // Display personalized stream recommendations
});
```

</details>

<details>
<summary>📥 Installation</summary>

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

</details>

<details>
<summary>⚙️ Configuration</summary>

### Environment Variables
```env
# Required for manual installation
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret

# Optional settings
PORT=3000                    # Server port (default: 3000)
NODE_ENV=development        # Environment (development/production)
LOG_LEVEL=info             # Logging level (error/warn/info/debug)
SMITHERY_MODE=false        # Enable Smithery integration
WEBHOOK_URL=              # Webhook endpoint URL
WEBHOOK_SECRET=           # Webhook signature secret
```

<details>
<summary>🔍 Configuration Details</summary>

#### PORT Configuration
- **Default**: 3000
- **Purpose**: Specifies the port number where the MCP server will listen for incoming connections
- **Usage**:
  ```bash
  # Development
  PORT=3000 npm run dev
  
  # Production
  PORT=8080 npm run mcp:prod
  ```
- **Note**: Ensure the port is not in use by other applications

#### LOG_LEVEL Configuration
- **Default**: info
- **Available Levels**:
  - `error`: Only critical errors
  - `warn`: Warnings and errors
  - `info`: General information, warnings, and errors
  - `debug`: Detailed debugging information
- **Usage**:
  ```bash
  # Production (minimal logging)
  LOG_LEVEL=error npm run mcp:prod
  
  # Development (detailed logging)
  LOG_LEVEL=debug npm run dev
  ```
- **Note**: Higher log levels may impact performance

</details>

</details>

<details>
<summary>🚀 Usage</summary>

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

</details>

<details>
<summary>👨‍💻 Developer Guide</summary>

### What is MCP?
Model Context Protocol (MCP) is a standardized way for AI models to interact with external services. Think of it as a universal translator that helps AI models understand and use different APIs.

### Why Use This Server?
- **Save Development Time**: No need to build API integrations from scratch
- **Standardized Interface**: Consistent way to interact with Kick's services
- **Real-time Updates**: Get instant notifications about stream events
- **Built-in Security**: OAuth and rate limiting handled automatically

</details>

<details>
<summary>🔧 MCP Methods</summary>

### Authentication Methods
```json
// Get OAuth URL
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

// Get Access Token
{
  "jsonrpc": "2.0",
  "method": "getAccessToken",
  "params": {
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "code": "authorization_code",
    "redirect_uri": "http://localhost:3000/auth/callback"
  },
  "id": 1
}

// Refresh Token
{
  "jsonrpc": "2.0",
  "method": "refreshAccessToken",
  "params": {
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "refresh_token": "your_refresh_token"
  },
  "id": 1
}

// Validate Token
{
  "jsonrpc": "2.0",
  "method": "validateToken",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Revoke Token
{
  "jsonrpc": "2.0",
  "method": "revokeToken",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}
```

### User Methods
```json
// Get User Profile
{
  "jsonrpc": "2.0",
  "method": "getUserProfile",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Update User Profile
{
  "jsonrpc": "2.0",
  "method": "updateUserProfile",
  "params": {
    "access_token": "user_access_token",
    "data": {
      "display_name": "New Name",
      "bio": "New Bio"
    }
  },
  "id": 1
}

// Get User Subscriptions
{
  "jsonrpc": "2.0",
  "method": "getUserSubscriptions",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Emotes
{
  "jsonrpc": "2.0",
  "method": "getUserEmotes",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Badges
{
  "jsonrpc": "2.0",
  "method": "getUserBadges",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Follows
{
  "jsonrpc": "2.0",
  "method": "getUserFollows",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Blocked Users
{
  "jsonrpc": "2.0",
  "method": "getUserBlockedUsers",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Clips
{
  "jsonrpc": "2.0",
  "method": "getUserClips",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Videos
{
  "jsonrpc": "2.0",
  "method": "getUserVideos",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Highlights
{
  "jsonrpc": "2.0",
  "method": "getUserHighlights",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Scheduled Streams
{
  "jsonrpc": "2.0",
  "method": "getUserScheduledStreams",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Notifications
{
  "jsonrpc": "2.0",
  "method": "getUserNotifications",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Wallet
{
  "jsonrpc": "2.0",
  "method": "getUserWallet",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get User Gifts
{
  "jsonrpc": "2.0",
  "method": "getUserGifts",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}
```

### Chat Methods
```json
// Get Chat Messages
{
  "jsonrpc": "2.0",
  "method": "getChatMessages",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Send Chat Message
{
  "jsonrpc": "2.0",
  "method": "sendChatMessage",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "message": "Hello, Kick chat!"
  },
  "id": 1
}

// Get Chat Settings
{
  "jsonrpc": "2.0",
  "method": "getChatSettings",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Ban User
{
  "jsonrpc": "2.0",
  "method": "banUser",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "user_id": "789012"
  },
  "id": 1
}

// Unban User
{
  "jsonrpc": "2.0",
  "method": "unbanUser",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "user_id": "789012"
  },
  "id": 1
}

// Timeout User
{
  "jsonrpc": "2.0",
  "method": "timeoutUser",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "user_id": "789012",
    "duration": 300
  },
  "id": 1
}

// Delete Message
{
  "jsonrpc": "2.0",
  "method": "deleteMessage",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "message_id": "789012"
  },
  "id": 1
}

// Clear Chat
{
  "jsonrpc": "2.0",
  "method": "clearChat",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Chat User Info
{
  "jsonrpc": "2.0",
  "method": "getChatUserInfo",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "user_id": "789012"
  },
  "id": 1
}
```

### Channel Methods
```json
// Get Channel Info
{
  "jsonrpc": "2.0",
  "method": "getChannelInfo",
  "params": {
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Followers
{
  "jsonrpc": "2.0",
  "method": "getChannelFollowers",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Subscribers
{
  "jsonrpc": "2.0",
  "method": "getChannelSubscribers",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Emotes
{
  "jsonrpc": "2.0",
  "method": "getChannelEmotes",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Badges
{
  "jsonrpc": "2.0",
  "method": "getChannelBadges",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Moderators
{
  "jsonrpc": "2.0",
  "method": "getChannelModerators",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Bans
{
  "jsonrpc": "2.0",
  "method": "getChannelBans",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel VIPs
{
  "jsonrpc": "2.0",
  "method": "getChannelVips",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Clips
{
  "jsonrpc": "2.0",
  "method": "getChannelClips",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Videos
{
  "jsonrpc": "2.0",
  "method": "getChannelVideos",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Highlights
{
  "jsonrpc": "2.0",
  "method": "getChannelHighlights",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Scheduled Streams
{
  "jsonrpc": "2.0",
  "method": "getChannelScheduledStreams",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Chat Rules
{
  "jsonrpc": "2.0",
  "method": "getChannelChatRules",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Chat Commands
{
  "jsonrpc": "2.0",
  "method": "getChannelChatCommands",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Categories
{
  "jsonrpc": "2.0",
  "method": "getChannelCategories",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Tags
{
  "jsonrpc": "2.0",
  "method": "getChannelTags",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Gifts
{
  "jsonrpc": "2.0",
  "method": "getChannelGifts",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Raids
{
  "jsonrpc": "2.0",
  "method": "getChannelRaids",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Channel Hosts
{
  "jsonrpc": "2.0",
  "method": "getChannelHosts",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}
```

### Stream Methods
```json
// Get Livestreams
{
  "jsonrpc": "2.0",
  "method": "getLivestreams",
  "params": {},
  "id": 1
}

// Get Livestream by Slug
{
  "jsonrpc": "2.0",
  "method": "getLivestreamBySlug",
  "params": {
    "slug": "channel_slug"
  },
  "id": 1
}

// Start Stream
{
  "jsonrpc": "2.0",
  "method": "startStream",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// End Stream
{
  "jsonrpc": "2.0",
  "method": "endStream",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Update Stream Info
{
  "jsonrpc": "2.0",
  "method": "updateStreamInfo",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "data": {
      "title": "New Stream Title",
      "category_id": "789012"
    }
  },
  "id": 1
}

// Update Stream Settings
{
  "jsonrpc": "2.0",
  "method": "updateStreamSettings",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "data": {
      "chat_delay": 3,
      "sub_only_chat": false
    }
  },
  "id": 1
}

// Get Stream Info
{
  "jsonrpc": "2.0",
  "method": "getStreamInfo",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Stream Viewers
{
  "jsonrpc": "2.0",
  "method": "getStreamViewers",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Stream Categories
{
  "jsonrpc": "2.0",
  "method": "getStreamCategories",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Stream Tags
{
  "jsonrpc": "2.0",
  "method": "getStreamTags",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Get Stream Stats
{
  "jsonrpc": "2.0",
  "method": "getStreamStats",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}

// Create Poll
{
  "jsonrpc": "2.0",
  "method": "createPoll",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "title": "Poll Title",
    "options": ["Option 1", "Option 2"],
    "duration": 300
  },
  "id": 1
}

// End Poll
{
  "jsonrpc": "2.0",
  "method": "endPoll",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "poll_id": "789012"
  },
  "id": 1
}

// Create Prediction
{
  "jsonrpc": "2.0",
  "method": "createPrediction",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "title": "Prediction Title",
    "options": ["Option 1", "Option 2"],
    "duration": 300
  },
  "id": 1
}

// End Prediction
{
  "jsonrpc": "2.0",
  "method": "endPrediction",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "prediction_id": "789012",
    "winning_outcome_id": "outcome_id"
  },
  "id": 1
}

// Create Marker
{
  "jsonrpc": "2.0",
  "method": "createMarker",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "description": "Marker Description"
  },
  "id": 1
}
```

### Webhook Methods
```json
// Create Webhook
{
  "jsonrpc": "2.0",
  "method": "createWebhook",
  "params": {
    "access_token": "user_access_token",
    "url": "https://your-webhook-url.com",
    "events": ["stream.online", "stream.offline"]
  },
  "id": 1
}

// Delete Webhook
{
  "jsonrpc": "2.0",
  "method": "deleteWebhook",
  "params": {
    "access_token": "user_access_token",
    "webhook_id": "789012"
  },
  "id": 1
}

// List Webhooks
{
  "jsonrpc": "2.0",
  "method": "listWebhooks",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Get Webhook Events
{
  "jsonrpc": "2.0",
  "method": "getWebhookEvents",
  "params": {
    "access_token": "user_access_token"
  },
  "id": 1
}

// Verify Webhook Signature
{
  "jsonrpc": "2.0",
  "method": "verifyWebhookSignature",
  "params": {
    "signature": "webhook_signature",
    "message_id": "message_id",
    "timestamp": "timestamp",
    "body": "webhook_body"
  },
  "id": 1
}

// Get Public Key
{
  "jsonrpc": "2.0",
  "method": "getPublicKey",
  "params": {},
  "id": 1
}

// Get Webhook Payloads
{
  "jsonrpc": "2.0",
  "method": "getWebhookPayloads",
  "params": {
    "access_token": "user_access_token",
    "event_type": "stream.online"
  },
  "id": 1
}

// Retry Webhook
{
  "jsonrpc": "2.0",
  "method": "retryWebhook",
  "params": {
    "access_token": "user_access_token",
    "webhook_id": "789012",
    "message_id": "message_id"
  },
  "id": 1
}

// Check Webhook Subscription Status
{
  "jsonrpc": "2.0",
  "method": "checkWebhookSubscriptionStatus",
  "params": {
    "access_token": "user_access_token",
    "webhook_id": "789012"
  },
  "id": 1
}
```

### Search and Discovery Methods
```json
// Search Channels
{
  "jsonrpc": "2.0",
  "method": "searchChannels",
  "params": {
    "query": "gaming"
  },
  "id": 1
}

// Search Streams
{
  "jsonrpc": "2.0",
  "method": "searchStreams",
  "params": {
    "query": "just chatting"
  },
  "id": 1
}

// Search Users
{
  "jsonrpc": "2.0",
  "method": "searchUsers",
  "params": {
    "query": "username"
  },
  "id": 1
}

// Search Categories
{
  "jsonrpc": "2.0",
  "method": "searchCategories",
  "params": {
    "query": "gaming"
  },
  "id": 1
}

// Get Categories
{
  "jsonrpc": "2.0",
  "method": "getCategories",
  "params": {},
  "id": 1
}

// Get Category
{
  "jsonrpc": "2.0",
  "method": "getCategory",
  "params": {
    "category_id": "123456"
  },
  "id": 1
}

// Get Category Streams
{
  "jsonrpc": "2.0",
  "method": "getCategoryStreams",
  "params": {
    "category_id": "123456"
  },
  "id": 1
}

// Get Top Streams
{
  "jsonrpc": "2.0",
  "method": "getTopStreams",
  "params": {},
  "id": 1
}

// Get Recommended Streams
{
  "jsonrpc": "2.0",
  "method": "getRecommendedStreams",
  "params": {
    "access_token": "user_access_token",
    "category_id": "123456"
  },
  "id": 1
}

// Get Followed Streams
{
  "jsonrpc": "2.0",
  "method": "getFollowedStreams",
  "params": {
    "access_token": "user_access_token",
    "category_id": "123456"
  },
  "id": 1
}
```

### Clip Methods
```json
// Create Clip
{
  "jsonrpc": "2.0",
  "method": "createClip",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456",
    "start_time": 60,
    "end_time": 120
  },
  "id": 1
}

// Get Clip
{
  "jsonrpc": "2.0",
  "method": "getClip",
  "params": {
    "access_token": "user_access_token",
    "clip_id": "789012"
  },
  "id": 1
}

// Delete Clip
{
  "jsonrpc": "2.0",
  "method": "deleteClip",
  "params": {
    "access_token": "user_access_token",
    "clip_id": "789012"
  },
  "id": 1
}

// Update Clip
{
  "jsonrpc": "2.0",
  "method": "updateClip",
  "params": {
    "access_token": "user_access_token",
    "clip_id": "789012",
    "title": "New Clip Title",
    "description": "New Clip Description"
  },
  "id": 1
}
```

### Channel by Slug Methods
```json
// Get Channel by Slug
{
  "jsonrpc": "2.0",
  "method": "getChannelBySlug",
  "params": {
    "slug": "channel_slug"
  },
  "id": 1
}
```

### App Access Token Method
```json
// Get App Access Token
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

### Chat Identity Methods
```json
// Get Chat Sender Identity
{
  "jsonrpc": "2.0",
  "method": "getChatSenderIdentity",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}
```

### Subscription Status Methods
```json
// Get Channel Subscription Status
{
  "jsonrpc": "2.0",
  "method": "getChannelSubscriptionStatus",
  "params": {
    "access_token": "user_access_token",
    "channel_id": "123456"
  },
  "id": 1
}
```

### Webhook Subscription Methods
```json
// Get Webhook Subscriptions
{
  "jsonrpc": "2.0",
  "method": "getWebhookSubscriptions",
  "params": {
    "access_token": "user_access_token",
    "webhook_id": "789012"
  },
  "id": 1
}

// Update Webhook Subscriptions
{
  "jsonrpc": "2.0",
  "method": "updateWebhookSubscriptions",
  "params": {
    "access_token": "user_access_token",
    "webhook_id": "789012",
    "subscriptions": ["stream.online", "stream.offline"]
  },
  "id": 1
}
```

</details>

<details>
<summary>🤝 Contributing</summary>

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

</details>

<details>
<summary>📝 License</summary>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

</details>

<details>
<summary>📞 Support</summary>

For support, email support@nosytlabs.com

</details>

<details>
<summary>💰 Support Our Work</summary>

<div align="center">

| Platform | Address |
|----------|---------|
| Bitcoin | bc1q3yvf74e6h735qtuptygxa7dwf8hvwasyw0uh7c |
| GitHub Sponsors | [Sponsor](https://github.com/sponsors/NosytLabs) |

</div>

</details>

<details>
<summary>🙏 Acknowledgments</summary>

- Kick Engineering Team
- Open Source Community
- All Contributors

</details>

---

<div align="center">
  Made with ❤️ by NosytLabs
  
  [![Twitter](https://img.shields.io/badge/Twitter-@NosytLabs-blue)](https://twitter.com/NosytLabs)
  [![GitHub](https://img.shields.io/badge/GitHub-NosytLabs-lightgrey)](https://github.com/NosytLabs)
  [![Website](https://img.shields.io/badge/Website-nosytlabs.com-green)](https://nosytlabs.com)
</div>

## 🔄 Value Proposition

### Why Use Our MCP Server?

1. **Standardized Interface**
   - Provides a consistent way to interact with Kick's services
   - Abstracts away API complexity
   - Reduces development time and effort

2. **Enhanced Security**
   - Built-in OAuth 2.0 with PKCE support
   - Automatic token refresh and validation
   - Rate limiting and error handling

3. **Real-time Capabilities**
   - WebSocket support for live updates
   - Event-driven architecture
   - Low latency communication

4. **AI Integration**
   - Designed specifically for AI model interaction
   - Standardized input/output formats
   - Built-in support for AI features

5. **Developer Experience**
   - TypeScript-first implementation
   - Comprehensive documentation
   - Detailed examples and use cases

6. **Enterprise Features**
   - Advanced monitoring and analytics
   - Smart caching for performance
   - Scalable architecture

### Value for Different Users

#### For Streamers
- Automated stream management
- Enhanced viewer engagement
- Smart content creation
- Advanced analytics

#### For Viewers
- Personalized viewing experience
- Smart content discovery
- Enhanced chat features
- Custom notifications

#### For Developers
- Rapid integration
- Standardized interface
- Built-in security
- AI-ready architecture

<details>
<summary>⚡ Rate Limiting & Best Practices</summary>

### Rate Limits
- **Authentication**: 100 requests per minute
- **Chat Operations**: 50 messages per 30 seconds
- **Moderation Actions**: 20 actions per minute
- **API Requests**: 1000 requests per hour

### Best Practices
1. **Implement Exponential Backoff**
```typescript
async function makeRequestWithRetry() {
  let retries = 0;
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  while (retries < maxRetries) {
    try {
      return await makeRequest();
    } catch (error) {
      if (error.status === 429) { // Rate limit exceeded
        const delay = baseDelay * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
}
```

2. **Use Caching**
```typescript
// Cache user profiles for 5 minutes
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getUserProfile(userId) {
  if (userCache.has(userId)) {
    const { data, timestamp } = userCache.get(userId);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  const data = await fetchUserProfile(userId);
  userCache.set(userId, { data, timestamp: Date.now() });
  return data;
}
```

3. **Batch Operations**
```typescript
// Instead of individual requests
async function batchUpdateEmotes(emotes) {
  const batchSize = 10;
  for (let i = 0; i < emotes.length; i += batchSize) {
    const batch = emotes.slice(i, i + batchSize);
    await Promise.all(batch.map(emote => updateEmote(emote)));
  }
}
```

4. **Monitor Usage**
```typescript
// Track API usage
const usageTracker = {
  requests: 0,
  lastReset: Date.now(),
  
  trackRequest() {
    const now = Date.now();
    if (now - this.lastReset >= 3600000) { // 1 hour
      this.requests = 0;
      this.lastReset = now;
    }
    this.requests++;
  }
};
```

</details>
