
# 🚀 Kick MCP Server

[![Smithery badge](https://smithery.ai/badge/@NosytLabs/kickmcp)](https://smithery.ai/server/@NosytLabs/kickmcp)
[![Open in Cursor](https://cursor.sh/button.svg)](https://cursor.sh/editor?github_repo=NosytLabs/KickMCP)

> **A modern MCP server for [Kick](https://kick.com) with AI coder support (Cursor, Claude, Trae)**

---

## 🚀 Quick Start
```bash
npx --yes @nosytlabs/kickmcp@latest
```

## 🔑 Authentication Setup
1. Create `.env` file from `.env.example`
2. Get Kick API credentials:
   - Visit [Kick Developer Portal](https://dev.kick.com)
   - Create application with redirect URI: `http://localhost:3000/kick_callback`
   - Add `CLIENT_ID` and `CLIENT_SECRET` to `.env`

## 📋 Core Environment Variables
```ini
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
KICK_REDIRECT_URI=http://localhost:3000/kick_callback
LOG_LEVEL=info
```

<details>
<summary><strong>📖 Full Documentation</strong></summary>

- [JSON-RPC Methods](#json-rpc-methods)
- [Authentication Flow](#authentication-flow)
- [AI Integration](#ai-integration)
- [Troubleshooting](#troubleshooting)
</details>

---

## 📝 Introduction

Kick MCP Server bridges your streaming software and the Kick API using the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). It provides a standardized, extensible interface for chat, stream management, and more.

---

## ✨ Features

- **Full Kick API Integration**:
  ```http
  POST /api/kick/chat/messages
  Authorization: Bearer <token>
  Content-Type: application/json
  
  {
    "channel": "channel_id",
    "message": "Hello Kick!"
  }
  ```
  - Stream info endpoints: `GET /api/kick/streams/:channel`
  - User management: `GET/PUT /api/kick/users/:id`
- **MCP Standard**: JSON-RPC 2.0, authentication, and extensible endpoints.
- **Modern TypeScript Codebase**: Strict typing, modular structure, and best practices.
- **Diagnostics & Inspector**: Built-in tools to verify server health and MCP compliance.
- **Easy Integration**: Works with OBS, Streamlabs, and any MCP-compatible client.

---

## 📋 Requirements

- **Node.js** v18.x or later
- **Kick Developer Account** (for OAuth credentials)
- **(Optional)** Docker for containerized deployment

---

## ⚡ Installation

<details>
<summary><strong>From Source</strong></summary>

```bash
git clone https://github.com/NosytLabs/KickMCP.git
cd KickMCP
npm install
```
</details>

<details>
<summary><strong>With Docker</strong></summary>

```bash
docker build -t kickmcp .
docker run -p 3000:3000 --env-file .env kickmcp
```
</details>

---

## ⚙️ Configuration

1. Copy `.env.example` to `.env` and fill in your Kick API credentials:

```
KICK_CLIENT_ID=your_kick_client_id
KICK_CLIENT_SECRET=your_kick_client_secret
KICK_REDIRECT_URI=https://yourdomain.com/kick_callback.html,http://localhost:3000/kick_callback.html
TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key
```

2. (Optional) Adjust `KICK_API_BASE_URL`, `PORT`, and other settings as needed.

---

## 🚀 Usage

Start the server:

```bash
npm run build
npm start
```

Or for development:

```bash
npm run dev
```

The server listens for JSON-RPC 2.0 requests on the configured port (default: 3000).

---

## 🤖 Integration with AI Tools

### Real-World Use Cases

1. **Chat Moderation Assistant**  
   Automatically flag inappropriate messages using AI content filters while maintaining MCP compliance
   - Example: Integrate with Perspective API to score message toxicity
   - Auto-timeout users exceeding toxicity threshold
   - Maintain moderation audit logs

2. **Stream Analytics Dashboard**  
   Combine Kick chat data with AI-powered sentiment analysis and viewer engagement metrics
   - Real-time emotion detection using computer vision on stream video
   - Chat sentiment correlation with viewer retention
   - Automated highlight reel generation

3. **Automated Content Highlights**  
   Use NLP to detect and highlight memorable moments in chat during live streams
   - Cluster similar chat messages to identify trending topics
   - Detect hype moments using message velocity analysis
   - Auto-generate chapter markers for VODs

4. **Personalized Notifications**  
   AI-driven system to notify streamers about important chat patterns in real-time
   - Machine learning models to detect:
     - Emerging inside jokes/community memes
     - Potential community conflicts
     - Sponsor/product mention opportunities

5. **AI Co-Streamer System**
   - GPT-4 integration for automated chat responses
   - Context-aware conversation memory
   - Streamer personality cloning safeguards

6. **Content Compliance Scanner**
   - Real-time audio/video analysis for DMCA compliance
   - Automated soundtrack switching for flagged content
   - Visual brand safety checks for overlays

### Enhanced AI Integration Patterns

**Chat Moderation Deep Dive**
```typescript
// Advanced moderation workflow with sentiment analysis
export async function handleChatMessage(msg: ChatMessage) {
  // Real-time toxicity scoring
  const toxicity = await analyzeText(msg.content, {
    models: ['perspective-api'],
    thresholds: { SEVERE_TOXICITY: 0.85 }
  });

  // Automated moderation actions
  if (toxicity.severeToxicity) {
    await executeMCPCommand('deleteMessage', { messageId: msg.id });
    await executeMCPCommand('timeoutUser', 
      { userId: msg.sender.id, duration: 300 });
    
    // Log incident to moderation dashboard
    logToService('moderation', {
      type: 'AUTO_MOD',
      message: msg.content,
      scores: toxicity
    });
  }
}
```

**Stream Analytics Implementation**
```typescript
// Real-time viewer engagement tracking
const analyticsEngine = new AnalyticsService({
  metrics: ['chatRate', 'emoteFrequency', 'sentimentTrend'],
  flushInterval: 5000
});

// Correlation analysis example
mcpServer.on('chatMessage', (msg) => {
  analyticsEngine.record('message', {
    length: msg.content.length,
    emotes: msg.emotes.length,
    sentiment: analyzeSentiment(msg.content)
  });
});

// Generate periodic insights
setInterval(() => {
  const report = analyticsEngine.generateReport({
    timeframe: '5m',
    metrics: ['engagementScore', 'toxicityTrend']
  });
  
  executeMCPCommand('updateStreamOverlay', {
    metric: report.engagementScore
  });
}, 300000);
```

3. **Automated Content Highlights**  
   Use NLP to detect and highlight memorable moments in chat during live streams
   - Cluster similar chat messages to identify trending topics
   - Detect hype moments using message velocity analysis
   - Auto-generate chapter markers for VODs

4. **Personalized Notifications**  
   AI-driven system to notify streamers about important chat patterns in real-time
   - Machine learning models to detect:
     - Emerging inside jokes/community memes
     - Potential community conflicts
     - Sponsor/product mention opportunities

5. **AI Co-Streamer System**
   - GPT-4 integration for automated chat responses
   - Context-aware conversation memory
   - Streamer personality cloning safeguards

6. **Content Compliance Scanner**
   - Real-time audio/video analysis for DMCA compliance
   - Automated soundtrack switching for flagged content
   - Visual brand safety checks for overlays

### Expanded Examples

<details>
<summary><strong>Cursor AI</strong></summary>

1. Install the Kick MCP Server following the installation instructions above.
2. Configure your Cursor AI project to point to the MCP server URL (default: http://localhost:3000).
3. Use the JSON-RPC methods documented in `docs/MCP_IMPLEMENTATION_GUIDE.md`.
4. Example integration:
   ```javascript
   // In your Cursor AI project
   const response = await fetch('http://localhost:3000', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       jsonrpc: '2.0',
       method: 'getUserProfile',
       params: {},
       id: 1
     })
   });
   const data = await response.json();
   ```
</details>

<details>
<summary><strong>Roo Code</strong></summary>

1. Set up the Kick MCP Server as described in the installation section.
2. Configure Roo Code to connect to your local MCP server instance.
3. Refer to the JSON-RPC method reference for available endpoints.
4. Example usage in Roo Code:
   ```javascript
   // Connect to Kick MCP Server
   const kickMCP = await RooCode.connect('http://localhost:3000');
   
   // Authenticate with Kick
   await kickMCP.call('kickAuth.initiateLogin');
   
   // Get stream information
   const streamInfo = await kickMCP.call('getStreamInfo');
   ```
</details>

<details>
<summary><strong>Trae AI Integration</strong></summary>

**Typical Implementation Flow:**
1. Install required packages:
   ```bash
   npm install @traeai/core kick-mcp-client
   ```
2. Configure connection:
   ```typescript
   // trae-config.ts
   export default {
     kick: {
       endpoint: process.env.KICK_MCP_URL,
       methods: {
         chat: 'getChatMessages',
         auth: 'kickAuth.initiateLogin'
       }
     }
   }
   ```
3. Authentication workflow:
   ```typescript
   async function authenticate() {
     const authResult = await trae.call({
       jsonrpc: '2.0',
       method: 'kickAuth.initiateLogin',
       params: {
         scopes: ['chat:read', 'channel:details']
       }
     });
     
     // Redirect user to Kick's OAuth page
     window.location.href = authResult.redirectUrl;
   }
   ```
4. Real-time chat processing:
   ```typescript
   // Set up chat listener
   trae.createStream('kickChat', {
     method: 'subscribeChatMessages',
     params: { channel: 'my-channel' }
   });
   
   trae.on('kickChat', (msg) => {
     const analysis = await trae.ai.analyze({
       text: msg.content,
       tasks: ['sentiment', 'toxicity']
     });
     
     if (analysis.toxicity.score > 0.9) {
       await trae.call({
         method: 'deleteChatMessage',
         params: { messageId: msg.id }
       });
     }
   });
   ```
</details>

<details>
<summary><strong>Claude</strong></summary>

1. Install and run the Kick MCP Server.
2. Configure Claude to connect to the MCP server using the provided JSON-RPC interface.
3. Use the authentication flow and API methods as documented.
4. Example integration:
   ```python
   # In your Claude integration
   import requests
   import json
   
   response = requests.post('http://localhost:3000', json={
     "jsonrpc": "2.0",
     "method": "getChannelInfo",
     "params": {"channelName": "example"},
     "id": 1
   })
   
   data = response.json()
   ```
</details>

---

## 🛠️ Endpoints & Extending MCP

All Kick API endpoints are modularized in `src/services/kick/`. To add or update endpoints:

1. Create or edit a service file (e.g., `UserService.ts`, `ChatService.ts`).
2. Add a method following the pattern:
   - Use `makeRequest` from `BaseKickService`.
   - Document parameters and return types.
3. Register the method in `src/mcp/handler.ts` with a JSON-RPC method name and schema.
4. Restart the server.

**Example JSON-RPC Request:**

```json
{
  "jsonrpc": "2.0",
  "method": "getUserProfile",
  "params": {},
  "id": 1
}
```

**Authentication:**
- Use `kickAuth.initiateLogin` to start OAuth, then `getAccessToken` with the code and state.
- Tokens are securely stored and used automatically for future requests.

---

## 🔒 Environment Variables

- `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, `KICK_REDIRECT_URI`: Required for OAuth.
- `TOKEN_ENCRYPTION_KEY`: Required for secure token storage.
- `PORT`, `NODE_ENV`, `LOG_LEVEL`: Optional server settings.

---

## 🏗️ Project Structure

```
KickMCP/
├── src/
│   ├── services/kick/          # Kick API service implementations
│   │   ├── AuthService.ts       - OAuth flows & token management
│   │   ├── ChatService.ts       - Real-time chat operations
│   │   ├── ChannelService.ts    - Channel metadata & configuration
│   │   └── StreamService.ts     - Stream health & broadcast data
│   ├── mcp/                    # MCP protocol implementation
│   └── utils/                  # Shared utilities
├── config/                     # Environment configuration
├── docs/                       # Extended documentation
├── tests/                      # Integration & unit tests
└── public/                     # Web assets & inspector tools

### Key Implementation Patterns
1. **Service Layer Architecture**:
```typescript
// Typical service implementation (src/services/kick/ChatService.ts)
export class ChatService extends BaseKickService {
  async deleteMessage(messageId: string) {
    return this.makeRequest('DELETE', `/chat/${messageId}`);
  }
}
```

2. **MCP Endpoint Registration**:
```typescript
// Handler registration (src/mcp/handler.ts)
registerMethod('deleteChatMessage', {
  schema: Joi.object({
    messageId: Joi.string().required()
  }),
  handler: async (params) => chatService.deleteMessage(params.messageId)
});
```

3. **Configuration Management**:
```typescript
// Environment configuration (config/index.ts)
export const getConfig = () => ({
  kickApi: {
    baseUrl: process.env.KICK_API_BASE_URL,
    timeout: parseInt(process.env.API_TIMEOUT || '5000')
  }
});
```
## 🧩 Adding New Endpoints

<details>
<summary><strong>Step-by-Step Guide</strong></summary>

1. **Create or modify a service file**:
   ```typescript
   // src/services/kick/UserService.ts
   import { BaseKickService } from './BaseKickService';
   
   export class UserService extends BaseKickService {
     async getUserFollowers(params: { limit?: number }) {
       return this.makeRequest('GET', '/followers', params);
     }
   }
   ```

2. **Register in the MCP handler**:
   ```typescript
   // src/mcp/handler.ts
   registerMethod('getUserFollowers', {
     schema: {
       type: 'object',
       properties: {
         limit: { type: 'number', optional: true }
       }
     },
     handler: async (params) => userService.getUserFollowers(params)
   });
   ```

3. **Document the new endpoint** in your project documentation.
</details>

---

## 🧪 MCP Inspector & Diagnostics

- Use the built-in MCP Inspector at `/public/kick_callback.html` for OAuth callback and diagnostics.
- Logs and errors are output to the console and can be configured via `LOG_LEVEL`.

<details>
<summary><strong>Troubleshooting Common Issues</strong></summary>

- **Authentication Errors**: Verify your Kick API credentials and redirect URIs.
- **Connection Issues**: Check network connectivity and firewall settings.
- **Rate Limiting**: The server implements rate limiting to prevent API abuse.
- **Missing Endpoints**: Ensure you're using the correct method names as documented.
</details>

---

## 🤝 Contributing

- Fork, branch, and submit PRs.
- Follow code style and add tests for new endpoints.
- Service implementations:
  ```typescript
  // Standard Kick endpoint pattern
  router.post('/messages', 
    validateRequest(KickChatMessageSchema),
    asyncHandler(async (req, res) => {
      // Kick API implementation
  }));
  ```
- See `src/services/kick/` for modular patterns.

---

## 📝 License

MIT
