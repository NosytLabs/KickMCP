# Kick Docs Analysis

Reviewed sources:

- https://docs.kick.com
- https://github.com/KickEngineering/KickDevDocs
- https://docs.kick.com/apis/channel-rewards
- https://docs.kick.com/events/introduction
- https://docs.kick.com/events/event-types
- https://docs.kick.com/drops/drops-guide
- https://docs.kick.com/drops/drops-faqs
- https://docs.kick.com/apis/public-key
- https://docs.kick.com/getting-started/generating-tokens-oauth2-flow
- https://docs.kick.com/getting-started/scopes
- https://api.kick.com/swagger/doc.yaml

## Product Direction

KickMCP should be published as an unofficial developer MCP server and local agent skill, not as an official Kick-branded app. The repo should help developers, streamers, and agent builders connect their own Kick OAuth app credentials to MCP-capable clients.

## Auth Model

Kick has two useful token classes:

- App access tokens from `client_credentials`
- User access tokens from authorization code + PKCE

OAuth lives at `https://id.kick.com`. API calls live at `https://api.kick.com`.

KickMCP now supports:

- app token caching
- single-flight app-token requests
- network request timeouts
- OAuth authorization-code callback
- local `.kick-tokens.json` storage
- stored user-token refresh when a refresh token is available
- token introspection through the current `/oauth/token/introspect` endpoint
- token revocation through the current `/oauth/revoke` endpoint

## API Coverage

See [kick-api-coverage.md](kick-api-coverage.md) for the endpoint-by-endpoint map.

Notable current coverage updates from this audit:

- Added `kick_get_livestream_stats` for `/public/v1/livestreams/stats`
- Added `kick_introspect_token` for `/oauth/token/introspect`
- Added `kick_revoke_token` for `/oauth/revoke`
- Added deprecated-but-documented category compatibility tools for `/public/v1/categories` and `/public/v1/categories/{category_id}`
- Removed the separate AI-app surface and kept one full `/mcp` endpoint

## Webhooks

Kick's official real-time model is event subscriptions delivered to webhooks.

KickMCP implements:

- `POST /kick/webhooks`
- default signature enforcement
- one-hour public-key cache for signature verification
- `kick_verify_webhook_signature`
- `kick_get_public_key`
- event subscription list/create/delete

Kick may unsubscribe apps whose webhook endpoint fails for an extended period, so production webhook handlers should verify, enqueue/store, return quickly, and process asynchronously.

## Drops

Drops are organization-oriented. The Drops guide documents `GET /public/v1/drops/claims`, and KickMCP exposes it as `kick_get_drops_claims`.

This endpoint needs app credentials associated with the relevant Kick organization. Live testing with the Kickmunk app credentials returned an authorization/internal boundary error, which is expected for an app that is not tied to a Drops organization.

## Chat Logs

Kick's docs include:

- `POST /public/v1/chat`
- `DELETE /public/v1/chat/{message_id}`
- `chat.message.sent` webhook events

They do not include a public historical chat-log endpoint. Agents that need chat history should subscribe to `chat.message.sent` and store webhook payloads in their own database.

## Known Non-Goals

Do not claim support for these unless Kick adds official docs/endpoints:

- polls
- predictions
- stream start/stop control
- stream key retrieval
- websocket chat listening
- historical chat-log retrieval

## Verification

Use:

```bash
npm run smoke
npm run live:read
```

Write/destructive tools are not executed automatically. They require a specific target and explicit human confirmation.
