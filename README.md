# KickMCP

Unofficial Model Context Protocol server for the official Kick.com public API.

KickMCP is not affiliated with, endorsed by, or sponsored by Kick. Kick and KICK are trademarks of their respective owners.

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
- Webhook signature verification
- Drops claims retrieval for organization-associated OAuth apps
- KICKs leaderboard
- Moderation bans/timeouts/unbans
- Public key retrieval for webhook verification
- Apps SDK-compatible widget resource for curated AI app experiences

## Install

```bash
npm install -g kick-mcp
```

### Quick Start For Developers

1. Create a Kick app at https://kick.com/settings/developer.
2. Copy your client ID and client secret.
3. Add KickMCP to your MCP client.

Local stdio MCP example:

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

Minimum config only enables app-token reads. Add a user token when you want broadcaster actions such as chat, rewards, moderation, or channel updates.

### Quick Start For Streamers

1. Clone the repo or install the package.
2. Copy `.env.example` to `.env`.
3. Set `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, and `KICK_REDIRECT_URI`.
4. Run:

```bash
npm install
npm run build
npm run start
```

5. Open this URL to connect your Kick account:

```text
http://localhost:8787/kick/oauth/start
```

After OAuth completes, KickMCP stores a local `.kick-tokens.json` file. That file is ignored by git and must stay private.

Hosted HTTP:

```bash
cp .env.example .env
npm install
npm run build
npm run start
```

Developer MCP endpoint:

```text
http://localhost:8787/mcp
```

Curated ChatGPT app endpoint:

```text
http://localhost:8787/chatgpt/mcp
```

For ChatGPT-style developer testing, expose the local server through HTTPS:

```bash
ngrok http 8787
```

Then connect ChatGPT to:

```text
https://your-ngrok-domain/chatgpt/mcp
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

## Common Use Cases

### Streamer Assistant

Use these tools:

- `kick_get_channels`
- `kick_get_livestreams`
- `kick_get_categories`
- `kick_update_channel`
- `kick_send_chat_message`

Example prompts:

- "Check my current Kick channel and livestream status."
- "Find categories related to strategy games and suggest one for tonight."
- "Draft a chat announcement for my stream schedule. Do not send it yet."
- "Send this exact message as my bot: Going live in 10 minutes."

### Moderator Console

Use these tools:

- `kick_delete_chat_message`
- `kick_ban_or_timeout_user`
- `kick_unban_user`

Example prompts:

- "Delete this message ID after I confirm."
- "Prepare a 10-minute timeout for user 123 because of spam."
- "Unban user 123 from broadcaster 456."

Moderation tools are intentionally only in the developer `/mcp` profile.

### Rewards Manager

Use these tools:

- `kick_get_channel_rewards`
- `kick_create_channel_reward`
- `kick_update_channel_reward`
- `kick_delete_channel_reward`
- `kick_get_reward_redemptions`
- `kick_accept_reward_redemptions`
- `kick_reject_reward_redemptions`

Example prompts:

- "List my current channel rewards."
- "Create a 500-point reward named Song Request that requires user input."
- "Show pending redemptions for reward X."
- "Accept these redemption IDs after I confirm."

### Webhook Developer

Use these tools/routes:

- `kick_get_public_key`
- `kick_verify_webhook_signature`
- `kick_list_event_subscriptions`
- `kick_create_event_subscriptions`
- `kick_delete_event_subscriptions`
- `POST /kick/webhooks`

Example prompts:

- "Subscribe my app to chat.message.sent for broadcaster 123."
- "Verify this webhook signature against the raw body."
- "List current event subscriptions."

### Drops Developer

Use:

- `kick_get_drops_claims`
- `POST /kick/webhooks`

Example prompts:

- "Fetch the latest Drops claims for campaign 01..."
- "Explain how I should handle a Drops claim webhook idempotently."

Drops tools only work for OAuth apps associated with the relevant Kick organization.

## Environment

See `.env.example`.

For a full setup walkthrough, including scopes, redirect URLs, webhooks, and ChatGPT options, see [docs/setup.md](docs/setup.md).

Core variables:

- `KICK_CLIENT_ID`
- `KICK_CLIENT_SECRET`
- `KICK_REDIRECT_URI`
- `KICK_SCOPES`
- `KICK_USER_ACCESS_TOKEN` optional, otherwise use local OAuth callback storage
- `KICK_BOT_ACCESS_TOKEN` optional, for bot chat sends

Do not commit `.env`, token databases, or local token files.

## Tools

KICK MCP has two tool profiles:

- **Developer MCP** at `/mcp`: full Kick API tool surface for builders and local automation.
- **ChatGPT app** at `/chatgpt/mcp`: curated creator-facing surface for the public KICK app.

### Developer MCP Tools

Read-only:

- `kick_get_users`
- `kick_get_channels`
- `kick_get_livestreams`
- `kick_get_categories`
- `kick_get_channel_rewards`
- `kick_get_reward_redemptions`
- `kick_list_event_subscriptions`
- `kick_get_drops_claims`
- `kick_verify_webhook_signature`
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

## Curated AI App Profile

The curated app profile should avoid using official-looking branding unless you have permission. A safer app name is:

```text
KickMCP for Creators
```

The ChatGPT app should connect to:

```text
https://your-production-domain/chatgpt/mcp
```

The app backend is this MCP server. It serves an Apps SDK widget resource at:

```text
ui://widget/kick-v1.html
```

Current widget views cover channel, livestream, and approved chat action results.

Curated ChatGPT app tools:

- `kick_get_users`
- `kick_get_channels`
- `kick_get_livestreams`
- `kick_get_categories`
- `kick_update_channel`
- `kick_send_chat_message`
- `kick_get_channel_rewards`
- `kick_get_reward_redemptions`
- `kick_get_kicks_leaderboard`

Not exposed in the public ChatGPT app by default:

- Chat deletion
- Ban/timeout/unban moderation
- Reward creation/update/deletion
- Reward redemption accept/reject
- Webhook subscription management
- Public-key plumbing
- Drops organization claim retrieval

Those remain available to developers through `/mcp`.

### Drops Support

Kick Drops are organization-oriented. Kick's docs describe campaign setup in the developer dashboard and a public claims endpoint:

```text
GET /public/v1/drops/claims
```

KickMCP exposes this as `kick_get_drops_claims`, but it only works for OAuth apps associated with the relevant organization. Regular app credentials may receive an authorization error.

Recommended ChatGPT app use cases:

- Creator dashboard: summarize current channel, title, category, tags, live status, and viewers.
- Stream planning: find categories and suggest title/category updates.
- Chat assistant: draft chat announcements and send only after explicit approval.
- Rewards assistant: inspect rewards and redemptions without changing them.
- Community analysis: inspect KICKs leaderboard and explain supporter patterns.

## Docs Alignment

This server intentionally avoids stale claims from older cached KickMCP listings. It implements only endpoints present in the official Kick OpenAPI/docs checked from `KickEngineering/KickDevDocs`.

Not included unless Kick adds official endpoints:

- Poll creation
- Predictions
- Stream start/stop control
- Unofficial websocket chat listening

Kick's official real-time story is event subscriptions delivered by webhooks. KickMCP does not implement an unofficial websocket client.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run smoke
npm run start
```

`npm run smoke` is the main health check. It builds the project, starts an isolated local server, verifies both MCP profiles, checks live app-token reads, and confirms user-token-gated tools fail cleanly when no user token is configured.

Stdio:

```bash
npm run start:stdio
```

Health check:

```text
GET http://localhost:8787/health
```

## Submission Notes

Do not submit this as an official "KICK" app unless you have the rights to use that brand and can satisfy the Apps SDK submission requirements. For public submission, use a clearly unofficial name, a production HTTPS endpoint, a privacy policy, support contact, screenshots, test prompts, and a review-safe OAuth/test account flow.

## License

MIT
