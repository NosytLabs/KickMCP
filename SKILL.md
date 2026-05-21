---
name: kick-mcp
description: Use this skill when working with the KickMCP repository, integrating Kick.com APIs through MCP, testing the local MCP server, or deciding which Kick tools are safe for AI agents.
---

# KickMCP

KickMCP is an unofficial Model Context Protocol server for the official Kick.com public API.

Official API references:

- https://docs.kick.com
- https://github.com/KickEngineering/KickDevDocs
- https://api.kick.com/swagger/doc.yaml

## Repository Commands

```bash
npm install
npm run typecheck
npm run build
npm run smoke
npm run live:read
npm run start
npm run start:stdio
```

Read `docs/setup.md` before changing scopes, redirect URLs, webhook behavior, OAuth token storage, or MCP client guidance.

Use `npm run smoke` before claiming the server works. It verifies:

- build output
- `/mcp` tool list
- app-token reads for livestreams, livestream stats, channels, categories, category detail, token introspection, public key, and event subscriptions
- Drops claims when the configured app is associated with a Kick organization; otherwise the expected auth boundary is reported
- user-token-gated tools return clear errors when no user token is configured

Use `npm run live:read` when you need printable read-only examples from the live Kick API. It never prints secrets or token values.

## MCP Endpoint

HTTP:

```text
/mcp
```

Stdio:

```bash
kick-mcp
```

This is the full developer/admin MCP surface for local tools, coding agents, OpenClaw/Hermes-style automations, and advanced MCP clients.

## Recommended Workflows

### Read-Only Discovery

Use:

- `kick_introspect_token`
- `kick_get_channels`
- `kick_get_livestreams`
- `kick_get_livestream_stats`
- `kick_get_categories`
- `kick_search_categories_legacy`
- `kick_get_category_detail`
- `kick_get_public_key`
- `kick_list_event_subscriptions`

These can usually be tested with app credentials.

### Streamer Account Actions

Use only with a user token and explicit confirmation:

- `kick_update_channel`
- `kick_send_chat_message`
- `kick_get_channel_rewards`
- `kick_get_reward_redemptions`
- `kick_get_kicks_leaderboard`

### Developer/Admin Actions

Use explicit confirmation:

- webhook subscription create/delete
- Drops claim retrieval
- webhook signature verification
- reward mutation
- reward redemption accept/reject
- moderation
- chat delete

### Agent Prompts

- "List top live Kick streams and summarize the first result."
- "Look up channel slug `example` and show the broadcaster ID."
- "Find categories matching `Minecraft`, then get detail for the best category ID."
- "Check whether this configured Kick token is active."
- "Draft a Kick chat announcement, but do not send it."
- "Verify this Kick webhook signature with the raw body and headers."
- "Fetch Drops claims for campaign ID `...` if this app is authorized."

## Safety Rules

- Never commit `.env`, `.kick-tokens.json`, client secrets, access tokens, or refresh tokens.
- Do not run write tools in tests unless the user explicitly gives a target and confirms the action.
- Treat chat sends, chat deletes, moderation, reward writes, and event-subscription writes as explicit-confirmation actions.
- Keep claims aligned to official Kick docs. Do not add polls, predictions, stream start/stop, historical chat-log reads, or unofficial chat listening unless Kick documents those endpoints.

## Current Auth Reality

App credentials can smoke-test livestreams, livestream stats, channels, categories, public key, token introspection, and event subscription listing.

User access tokens are required for broadcaster-scoped actions and private reads such as channel rewards, reward redemptions, KICKs leaderboard, chat writes, channel updates, and moderation.

Stored OAuth user tokens are refreshed automatically when `.kick-tokens.json` includes a refresh token.

Drops claims use app access tokens, but only for OAuth apps associated with the relevant Kick organization.

## Docs Coverage Checklist

Before adding a new tool, confirm the endpoint exists in:

- `https://docs.kick.com`
- `https://github.com/KickEngineering/KickDevDocs`
- `https://api.kick.com/swagger/doc.yaml`

Then update:

- `src/kick/client.ts`
- `src/tool-schemas.ts`
- `src/mcp.ts`
- `README.md`
- `server.json`
- `scripts/smoke-test.mjs`
- `scripts/live-read-examples.mjs`
- `docs/kick-api-coverage.md`
