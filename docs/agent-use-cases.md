# Agent Use Cases

KickMCP is useful for MCP-capable coding agents, streamer assistants, local automations, and moderation tooling that need official Kick API access.

## Public Discovery

Use app credentials to inspect live public data:

- Find live streams by category, language, broadcaster ID, or viewer-count sort.
- Look up channels by slug or broadcaster user ID.
- Search categories through the current `/public/v2/categories` endpoint.
- Check livestream totals and current category detail.
- Verify the configured app token is active.

Relevant tools:

- `kick_get_livestreams`
- `kick_get_channels`
- `kick_get_categories`
- `kick_get_livestream_stats`
- `kick_introspect_token`

## Streamer Assistant

Use a user token after OAuth approval:

- Draft stream title/category updates before applying them.
- Send exact approved chat announcements.
- Inspect channel rewards and pending redemptions.
- Read KICKs leaderboard data for the authenticated broadcaster.

Relevant tools:

- `kick_update_channel`
- `kick_send_chat_message`
- `kick_get_channel_rewards`
- `kick_get_reward_redemptions`
- `kick_get_kicks_leaderboard`

## Moderation

Use explicit confirmation for all moderation actions:

- Delete a specific chat message by message ID.
- Ban or timeout a user from a broadcaster chat.
- Remove an existing ban or timeout.

Relevant tools:

- `kick_delete_chat_message`
- `kick_ban_or_timeout_user`
- `kick_unban_user`

## Webhook Workflows

Kick real-time events arrive through webhooks, not a public chat websocket.

- Subscribe to events such as `chat.message.sent`, follows, subscriptions, livestream changes, moderation bans, and KICKs gifts.
- Verify webhook signatures from raw body and Kick headers.
- Store verified webhook payloads in your own database for chat history, analytics, or agent memory.

Relevant tools and routes:

- `kick_list_event_subscriptions`
- `kick_create_event_subscriptions`
- `kick_delete_event_subscriptions`
- `kick_verify_webhook_signature`
- `POST /kick/webhooks`

## Safety Boundaries

Agents should treat these as explicit-confirmation actions:

- token revocation
- chat sends and deletes
- channel updates
- reward creation, updates, deletes, accepts, and rejects
- event subscription creates/deletes
- bans, timeouts, and unbans

KickMCP intentionally avoids unsupported claims such as historical chat-log reads, public websocket chat listening, predictions, polls, or stream start/stop control unless Kick documents those endpoints.
