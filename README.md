# KICK MCP

Production-ready Model Context Protocol server and ChatGPT App backend for the official Kick.com public API.

This project rebuilds the old `NosytLabs/KickMCP` idea as a current, docs-aligned integration. The source of truth is Kick's official documentation:

- https://docs.kick.com
- https://github.com/KickEngineering/KickDevDocs
- https://api.kick.com/swagger/doc.yaml

## What It Does

KICK MCP exposes Kick API capabilities as safe, typed MCP tools for AI clients and developer workflows.

Supported areas:

- OAuth 2.1 app tokens and user-token callback flow
- Users
- Channels
- Livestreams
- Categories via `/public/v2/categories`
- Chat send/delete
- Channel rewards and redemptions
- Event subscriptions and webhook receiver
- KICKs leaderboard
- Moderation bans/timeouts/unbans
- Public key retrieval for webhook verification
- ChatGPT Apps SDK widget resource for the KICK app

## Install

```bash
npm install -g kick-mcp
```

Local stdio MCP:

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

Hosted HTTP / ChatGPT App:

```bash
cp .env.example .env
npm install
npm run build
npm run start
```

MCP endpoint:

```text
http://localhost:8787/mcp
```

For ChatGPT developer mode, expose the local server through HTTPS:

```bash
ngrok http 8787
```

Then connect ChatGPT to:

```text
https://your-ngrok-domain/mcp
```

## Kick App Setup

Create a Kick app at https://kick.com/settings/developer.

Recommended local redirect URL:

```text
http://localhost:8787/kick/oauth/callback
```

Start the local OAuth flow:

```text
http://localhost:8787/kick/oauth/start
```

Webhook receiver:

```text
POST http://localhost:8787/kick/webhooks
```

Use an HTTPS tunnel URL for production-style webhook testing.

## Environment

See `.env.example`.

Core variables:

- `KICK_CLIENT_ID`
- `KICK_CLIENT_SECRET`
- `KICK_REDIRECT_URI`
- `KICK_SCOPES`
- `KICK_USER_ACCESS_TOKEN` optional, otherwise use local OAuth callback storage
- `KICK_BOT_ACCESS_TOKEN` optional, for bot chat sends

Do not commit `.env`, token databases, or local token files.

## Tools

Read-only:

- `kick_get_users`
- `kick_get_channels`
- `kick_get_livestreams`
- `kick_get_categories`
- `kick_get_channel_rewards`
- `kick_get_reward_redemptions`
- `kick_list_event_subscriptions`
- `kick_get_kicks_leaderboard`
- `kick_get_public_key`

Actions:

- `kick_update_channel`
- `kick_send_chat_message`
- `kick_delete_chat_message`
- `kick_create_channel_reward`
- `kick_update_channel_reward`
- `kick_delete_channel_reward`
- `kick_accept_reward_redemptions`
- `kick_reject_reward_redemptions`
- `kick_create_event_subscriptions`
- `kick_delete_event_subscriptions`
- `kick_ban_or_timeout_user`
- `kick_unban_user`

Action tools are annotated as non-read-only and destructive where appropriate. AI clients should ask for explicit user confirmation before using write, moderation, deletion, or chat-send tools.

## ChatGPT App

The ChatGPT app display name should be:

```text
KICK
```

The app backend is this MCP server. It serves an Apps SDK widget resource at:

```text
ui://widget/kick-v1.html
```

Current widget views cover channel, livestream, chat send, and chat delete results. Additional moderation/rewards/event dashboards can be layered on the same tool results.

## Docs Alignment

This server intentionally avoids stale claims from older cached KickMCP listings. It implements only endpoints present in the official Kick OpenAPI/docs checked from `KickEngineering/KickDevDocs`.

Not included unless Kick adds official endpoints:

- Poll creation
- Predictions
- Stream start/stop control
- Unofficial websocket chat listening

## Development

```bash
npm install
npm run typecheck
npm run build
npm run start
```

Stdio:

```bash
npm run start:stdio
```

Health check:

```text
GET http://localhost:8787/health
```

## License

MIT

