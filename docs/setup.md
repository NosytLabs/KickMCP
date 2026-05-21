# KickMCP Setup Guide

This guide covers scopes, OAuth redirect URLs, webhooks, and ChatGPT options.

## 1. Create A Kick App

Go to:

```text
https://kick.com/settings/developer
```

Create or edit an app and copy:

- Client ID
- Client Secret

For local development, set the redirect URL to:

```text
http://localhost:8787/kick/oauth/callback
```

If you use an HTTPS tunnel for OAuth, the redirect URL in the Kick app must exactly match the tunnel callback URL:

```text
https://your-domain.example/kick/oauth/callback
```

Kick's OAuth docs recommend `localhost` instead of `127.0.0.1` for local redirects.

## 2. Choose Scopes

Use the smallest scope set that matches the workflow.

### Read-Only Public Discovery

Good for browsing livestreams, channels, categories, public keys, and event subscriptions with app credentials.

```text
channel:read
events:subscribe
```

App access tokens can also access several public endpoints without user consent.

### Streamer Assistant

Good for updating stream metadata and sending chat after confirmation.

```text
user:read channel:read channel:write chat:write
```

### Rewards Manager

Good for reading and managing channel rewards and redemptions.

```text
user:read channel:read channel:rewards:read channel:rewards:write
```

### Moderator Console

Good for deleting messages, bans, timeouts, and unbans.

```text
user:read channel:read moderation:ban moderation:chat_message:manage
```

### Webhook Developer

Good for event subscription management.

```text
events:subscribe
```

### Full Local Development

Useful when testing every implemented user-token tool.

```text
user:read channel:read channel:write channel:rewards:read channel:rewards:write chat:write events:subscribe moderation:ban moderation:chat_message:manage kicks:read
```

`streamkey:read` exists in Kick's scope docs, but KickMCP does not currently expose a stream-key tool.

## 3. Configure Environment

```bash
cp .env.example .env
```

Fill:

```text
KICK_CLIENT_ID=...
KICK_CLIENT_SECRET=...
KICK_REDIRECT_URI=http://localhost:8787/kick/oauth/callback
KICK_SCOPES=user:read channel:read channel:write channel:rewards:read channel:rewards:write chat:write events:subscribe moderation:ban moderation:chat_message:manage kicks:read
```

Run:

```bash
npm install
npm run build
npm run start
```

Open:

```text
http://localhost:8787/kick/oauth/start
```

KickMCP stores user tokens in `.kick-tokens.json`. Do not commit that file.

## 4. Webhooks, Not WebSockets

Kick's official docs currently describe real-time delivery through webhooks and event subscriptions, not a general public websocket API.

Use:

```text
POST /kick/webhooks
```

Local webhook URLs must be exposed publicly:

```bash
ngrok http 8787
```

Then configure the Kick app webhook URL as:

```text
https://your-ngrok-domain/kick/webhooks
```

Kick webhook signatures use:

- `Kick-Event-Message-Id`
- `Kick-Event-Message-Timestamp`
- raw request body
- `Kick-Event-Signature`
- public key from `GET /public/v1/public-key`

KickMCP verifies signatures in `POST /kick/webhooks` when signature headers are present.

## 5. MCP Client Setup

### Stdio

```json
{
  "mcpServers": {
    "kick": {
      "command": "kick-mcp",
      "env": {
        "KICK_CLIENT_ID": "your-client-id",
        "KICK_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### HTTP

Developer profile:

```text
http://localhost:8787/mcp
```

Curated safer profile:

```text
http://localhost:8787/chatgpt/mcp
```

## 6. ChatGPT: App vs Plugin vs Action

Legacy ChatGPT plugins are not the recommended target for new work.

Current options:

- Apps SDK / MCP: best fit for this repo and the `/chatgpt/mcp` profile.
- Custom GPT Action: possible, but requires REST endpoints plus an OpenAPI schema. MCP JSON-RPC tools cannot be imported directly as a GPT Action.
- Public app submission: only use a clearly unofficial name unless you have rights to official Kick branding.

Recommended approach for now:

- Publish/use KickMCP as an MCP server.
- Let users add it to MCP-capable clients.
- Use `/chatgpt/mcp` for private ChatGPT developer testing or workspace apps.
- Do not submit as an official `KICK` app unless you have brand permission and a production review-ready deployment.

