# KickMCP Setup Guide

This guide covers Kick OAuth app setup, scopes, redirect URLs, webhooks, and MCP client configuration.

## 1. Create A Kick OAuth App

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

Good for livestreams, livestream stats, channels, categories, event subscriptions, public key, and token introspection with app credentials.

```text
channel:read events:subscribe
```

Several public endpoints also work with app access tokens without user consent.

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

### KICKs Leaderboard

Good for reading the authenticated broadcaster's KICKs leaderboard.

```text
user:read kicks:read
```

### Full Local Development

Useful when testing every implemented user-token tool.

```text
user:read channel:read channel:write channel:rewards:read channel:rewards:write chat:write events:subscribe moderation:ban moderation:chat_message:manage kicks:read
```

`streamkey:read` exists in Kick's scope docs, but KickMCP does not currently expose a stream-key tool because the current OpenAPI/doc surface checked for this repo does not include a stream-key endpoint.

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
KICK_VERIFY_WEBHOOK_SIGNATURES=true
KICK_REQUEST_TIMEOUT_MS=15000
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

KickMCP stores user tokens in `.kick-tokens.json`. It stores `expires_at` when possible and refreshes stored user tokens automatically when a refresh token is available. Do not commit that file.

## 4. Webhooks, Not WebSockets

Kick's official docs describe real-time delivery through event subscriptions and webhooks, not a general public websocket API.

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

KickMCP verifies webhook signatures by default. For local unsigned test payloads only:

```text
KICK_VERIFY_WEBHOOK_SIGNATURES=false
```

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

```text
http://localhost:8787/mcp
```

For hosted or tunneled MCP access, protect `/mcp` with a bearer token:

```text
MCP_REQUIRE_AUTH=true
MCP_AUTH_TOKEN=generate-a-long-random-token
```

Clients should send:

```text
Authorization: Bearer generate-a-long-random-token
```

## 6. Live Verification

Run:

```bash
npm run smoke
npm run live:read
npm run pack:check
```

`npm run smoke` is pass/fail. It checks the MCP tool list and safe live reads. It does not execute write tools.

`npm run live:read` prints example live API reads for docs/debugging. It never prints client secrets, access tokens, or refresh tokens.

## 7. Safety Boundaries

These tools can change Kick state and should require explicit human confirmation in AI clients:

- `kick_update_channel`
- `kick_revoke_token`
- `kick_send_chat_message`
- `kick_delete_chat_message`
- reward create/update/delete tools
- reward redemption accept/reject tools
- event subscription create/delete tools
- moderation tools

KickMCP does not provide historical chat logs because Kick does not expose that as a public API. Subscribe to `chat.message.sent` and store webhook payloads if your agent needs searchable chat history.
