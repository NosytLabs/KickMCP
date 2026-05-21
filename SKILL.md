---
name: kick-mcp
description: Use this skill when working with the KickMCP repository, integrating Kick.com APIs through MCP, testing the local MCP server, or deciding which Kick tools are safe to expose to AI clients.
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
npm run start
npm run start:stdio
```

Read `docs/setup.md` before changing scopes, redirect URLs, webhook behavior, or ChatGPT integration guidance.

Use `npm run smoke` before claiming the server works. It verifies:

- build output
- developer `/mcp` tool list
- curated `/chatgpt/mcp` tool list
- app-token reads for livestreams, channels, categories, public key, and event subscriptions
- Drops claims when the configured app is associated with a Kick organization; otherwise the expected auth error is reported
- user-token-gated tools return clear errors when no user token is configured

## Tool Profiles

Developer MCP endpoint:

```text
/mcp
```

This is the full developer/admin surface for local tools, coding agents, internal automations, and advanced MCP clients.

Curated ChatGPT-style endpoint:

```text
/chatgpt/mcp
```

This profile is intentionally smaller. It avoids default exposure of delete, ban, webhook admin, public-key plumbing, and reward mutation tools.

## Recommended Workflows

### Read-Only Discovery

Use:

- `kick_get_channels`
- `kick_get_livestreams`
- `kick_get_categories`
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

Use only in the `/mcp` profile:

- webhook subscription create/delete
- Drops claim retrieval
- webhook signature verification
- reward mutation
- reward redemption accept/reject
- moderation
- chat delete

### Example Prompts

- "List live Kick streams in Just Chatting, then summarize the top result."
- "Look up channel slug `example` and show the broadcaster ID."
- "Find categories matching `Minecraft`."
- "Draft a Kick chat announcement, but do not send it."
- "Verify this Kick webhook signature with the raw body and headers."
- "Fetch Drops claims for campaign ID `...` if this app is authorized."

## Safety Rules

- Never commit `.env`, `.kick-tokens.json`, client secrets, access tokens, or refresh tokens.
- Do not run write tools in tests unless the user explicitly gives a target and confirms the action.
- Treat chat sends, chat deletes, moderation, reward writes, and event-subscription writes as explicit-confirmation actions.
- Keep claims aligned to official Kick docs. Do not add polls, predictions, stream start/stop, or unofficial chat listening unless Kick documents those endpoints.

## Current Auth Reality

App credentials can smoke-test public reads such as livestreams, channels, categories, public key, and event subscriptions.

User access tokens are required for broadcaster-scoped actions and private reads such as channel rewards, reward redemptions, KICKs leaderboard, chat writes, channel updates, and moderation.

Drops claims use app access tokens, but only for OAuth apps associated with a Kick organization.

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
