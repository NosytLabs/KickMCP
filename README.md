# KickMCP

Unofficial Model Context Protocol server for the official Kick.com public API.

KickMCP is not affiliated with, endorsed by, or sponsored by Kick. Kick and KICK are trademarks of their respective owners.

This repo is MCP-first: one stdio server, one Streamable HTTP endpoint, one local skill file, and docs aligned to the current Kick developer API.

Official references:

- https://docs.kick.com
- https://github.com/KickEngineering/KickDevDocs
- https://api.kick.com/swagger/doc.yaml

## What It Does

KickMCP exposes Kick API capabilities as typed MCP tools for developer agents, streamer tooling, moderation workflows, and webhook/Drops integrations.

Implemented areas:

- OAuth app tokens, user OAuth callback, stored user-token refresh, and token revoke
- Token introspection
- Users
- Channels
- Livestreams and livestream stats
- Categories through the current `/public/v2/categories` endpoint
- Deprecated category search/detail endpoints for compatibility checks
- Chat send/delete
- Channel rewards and redemptions
- Event subscriptions and signed webhook receiver
- Drops claims for organization-associated OAuth apps
- KICKs leaderboard
- Moderation bans, timeouts, and unbans
- Kick public key retrieval and webhook signature verification

KickMCP intentionally does not claim support for undocumented endpoints. Kick does not currently expose historical chat logs through the public API. To capture chat, subscribe to `chat.message.sent` and store webhook events in your own system.

## Install

```bash
npm install -g kick-mcp
```

Local repo:

```bash
npm install
npm run build
```

## Quick Start

Create a Kick OAuth app at:

```text
https://kick.com/settings/developer
```

Use this local redirect URL:

```text
http://localhost:8787/kick/oauth/callback
```

Copy `.env.example` to `.env` and fill:

```text
KICK_CLIENT_ID=...
KICK_CLIENT_SECRET=...
KICK_REDIRECT_URI=http://localhost:8787/kick/oauth/callback
KICK_SCOPES=user:read channel:read channel:write channel:rewards:read channel:rewards:write chat:write events:subscribe moderation:ban moderation:chat_message:manage kicks:read
KICK_REQUEST_TIMEOUT_MS=15000
```

Run the HTTP server:

```bash
npm run start
```

Connect your Kick user token:

```text
http://localhost:8787/kick/oauth/start
```

The OAuth callback stores `.kick-tokens.json` locally. Keep it private; it is ignored by git.

## MCP Client Setup

Stdio:

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

HTTP:

```text
http://localhost:8787/mcp
```

For any non-local HTTP deployment, require a bearer token:

```text
MCP_REQUIRE_AUTH=true
MCP_AUTH_TOKEN=generate-a-long-random-token
```

Clients should send:

```text
Authorization: Bearer generate-a-long-random-token
```

Health check:

```text
GET http://localhost:8787/health
```

## Webhooks

Kick's official real-time API is webhook/event-subscription based, not a public websocket chat feed.

Local webhook route:

```text
POST http://localhost:8787/kick/webhooks
```

Use an HTTPS tunnel for Kick to reach your local machine:

```bash
ngrok http 8787
```

Then configure your Kick app webhook URL as:

```text
https://your-ngrok-domain/kick/webhooks
```

Webhook signatures are verified by default. Set this only for local debugging with synthetic unsigned payloads:

```text
KICK_VERIFY_WEBHOOK_SIGNATURES=false
```

## Useful Scopes

Use the smallest scope set that fits the workflow:

- Read/discovery: `channel:read events:subscribe`
- Streamer assistant: `user:read channel:read channel:write chat:write`
- Rewards manager: `user:read channel:read channel:rewards:read channel:rewards:write`
- Moderator console: `user:read channel:read moderation:ban moderation:chat_message:manage`
- KICKs leaderboard: `user:read kicks:read`
- Full local dev: `user:read channel:read channel:write channel:rewards:read channel:rewards:write chat:write events:subscribe moderation:ban moderation:chat_message:manage kicks:read`

`streamkey:read` exists in Kick's docs, but KickMCP does not expose a stream-key tool because the current OpenAPI/doc surface checked for this repo does not include a stream-key endpoint.

## Tool Catalog

Read and discovery:

- `kick_get_users`
- `kick_introspect_token`
- `kick_get_channels`
- `kick_get_livestreams`
- `kick_get_livestream_stats`
- `kick_get_categories`
- `kick_search_categories_legacy`
- `kick_get_category_detail`
- `kick_get_channel_rewards`
- `kick_get_reward_redemptions`
- `kick_list_event_subscriptions`
- `kick_get_drops_claims`
- `kick_verify_webhook_signature`
- `kick_get_kicks_leaderboard`
- `kick_get_public_key`

Actions:

- `kick_revoke_token`
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

Action tools are annotated as non-read-only and destructive where appropriate. Agents should ask for explicit confirmation before revoking tokens, sending chat, changing channel metadata, mutating rewards, deleting chat, changing event subscriptions, or performing moderation.

## Agent Use Cases

OpenClaw, Hermes, Codex, Claude Desktop, and other MCP-capable agents can use KickMCP for:

- Developer API exploration: inspect current Kick endpoints, token status, categories, livestream stats, and event subscriptions.
- Streamer operations: check live status, draft stream titles, find categories, and update metadata after confirmation.
- Chat assistant: draft and send exact approved announcements; collect chat events through webhooks for later analysis.
- Moderator console: prepare and execute timeouts, bans, unbans, and message deletes with explicit confirmation.
- Rewards manager: inspect rewards/redemptions and mutate reward state only when approved.
- Webhook developer: subscribe to events, verify signatures, and test idempotent event handling.
- Drops developer: retrieve claim data when the OAuth app belongs to the relevant Kick organization.

## Live Verification

Run:

```bash
npm run smoke
npm run live:read
```

`npm run smoke` builds the project, starts an isolated HTTP server, checks the MCP tool list, executes live read-only Kick calls with your configured app credentials, and confirms user-token-gated tools fail cleanly when no user token is configured.

`npm run live:read` prints read-only example results from the live Kick API without printing secrets. Values such as top livestreams and viewer counts are ephemeral.

Last verified with Kickmunk app credentials on 2026-05-21:

- app token introspection returned active app token metadata
- livestream stats returned a live total count
- top livestream/channel/category reads succeeded
- event subscription listing succeeded and returned an empty list for the app
- public key retrieval succeeded
- `/public/v1/users` with only app credentials returned `401 Unauthorized`, so user-profile reads should use a user token
- Drops claims returned an app/org authorization boundary error for this app, which is expected unless the app is tied to a Kick organization

## Development

```bash
npm install
npm run typecheck
npm run build
npm run pack:check
npm run smoke
npm run live:read
```

Stdio:

```bash
npm run start:stdio
```

HTTP:

```bash
npm run start
```

## Docs Alignment

See:

- [docs/setup.md](docs/setup.md)
- [docs/kick-api-coverage.md](docs/kick-api-coverage.md)
- [docs/live-read-examples.md](docs/live-read-examples.md)

This server avoids stale claims from older cached KickMCP directory listings. Not included unless Kick adds official docs/endpoints:

- Poll creation
- Predictions
- Stream start/stop control
- Historical chat-log retrieval
- Unofficial websocket chat listening

## Security

Never commit `.env`, `.kick-tokens.json`, client secrets, access tokens, or refresh tokens. The Kick client secret used for local testing was supplied out-of-band for this workspace and should be rotated if it was exposed anywhere public.

## License

MIT
