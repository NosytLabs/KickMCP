# Kick API Coverage

Sources checked on 2026-05-23:

- `https://docs.kick.com`
- `https://github.com/KickEngineering/KickDevDocs`
- `https://api.kick.com/swagger/doc.yaml`

Local source snapshots:

- `.kick-docs` at `KickEngineering/KickDevDocs` commit `a424375`
- `kick-openapi.yaml` fetched from `https://api.kick.com/swagger/doc.yaml`

## Implemented Endpoint Coverage

| Kick endpoint | Status | Tool or route | Token type |
| --- | --- | --- | --- |
| `POST /oauth/token` | Current | app token cache, OAuth callback, stored-token refresh | client credentials / user OAuth |
| `POST /oauth/revoke` | Current | `kick_revoke_token` | configured app, user, bot, or stored refresh token |
| `POST /oauth/token/introspect` | Current | `kick_introspect_token` | app, user, or bot token |
| `GET /public/v1/users` | Current | `kick_get_users` | user token for reliable profile reads; app token may hit `401` for ID lookup |
| `GET /public/v1/channels` | Current | `kick_get_channels` | app or user token |
| `PATCH /public/v1/channels` | Current | `kick_update_channel` | user token, `channel:write` |
| `GET /public/v1/livestreams` | Current | `kick_get_livestreams` | app or user token |
| `GET /public/v1/livestreams/stats` | Current | `kick_get_livestream_stats` | app or user token |
| `GET /public/v2/categories` | Current | `kick_get_categories` | app or user token |
| `GET /public/v1/categories` | Deprecated but documented | `kick_search_categories_legacy` | app or user token |
| `GET /public/v1/categories/{category_id}` | Deprecated but documented | `kick_get_category_detail` | app or user token |
| `POST /public/v1/chat` | Current | `kick_send_chat_message` | user/bot token, `chat:write` |
| `DELETE /public/v1/chat/{message_id}` | Current | `kick_delete_chat_message` | user token, `moderation:chat_message:manage` |
| `GET /public/v1/channels/rewards` | Current | `kick_get_channel_rewards` | user token, `channel:rewards:read` or `channel:rewards:write` |
| `POST /public/v1/channels/rewards` | Current | `kick_create_channel_reward` | user token, `channel:rewards:write` |
| `PATCH /public/v1/channels/rewards/{id}` | Current | `kick_update_channel_reward` | user token, `channel:rewards:write` |
| `DELETE /public/v1/channels/rewards/{id}` | Current | `kick_delete_channel_reward` | user token, `channel:rewards:write` |
| `GET /public/v1/channels/rewards/redemptions` | Current | `kick_get_reward_redemptions` | user token, rewards scope |
| `POST /public/v1/channels/rewards/redemptions/accept` | Current | `kick_accept_reward_redemptions` | user token, `channel:rewards:write` |
| `POST /public/v1/channels/rewards/redemptions/reject` | Current | `kick_reject_reward_redemptions` | user token, `channel:rewards:write` |
| `GET /public/v1/events/subscriptions` | Current | `kick_list_event_subscriptions` | app or user token |
| `POST /public/v1/events/subscriptions` | Current | `kick_create_event_subscriptions` | app or user token, `events:subscribe` when user token |
| `DELETE /public/v1/events/subscriptions` | Current | `kick_delete_event_subscriptions` | app or user token, `events:subscribe` when user token |
| `GET /public/v1/public-key` | Current | `kick_get_public_key` | no token required by live API; tool works without user token |
| `GET /public/v1/kicks/leaderboard` | Current | `kick_get_kicks_leaderboard` | user token, `kicks:read` |
| `POST /public/v1/moderation/bans` | Current | `kick_ban_or_timeout_user` | user token, `moderation:ban` |
| `DELETE /public/v1/moderation/bans` | Current | `kick_unban_user` | user token, `moderation:ban` |
| `GET /public/v1/drops/claims` | Current in Drops guide | `kick_get_drops_claims` | app token associated with the relevant Kick organization |
| `POST /public/v1/token/introspect` | Deprecated but documented | covered by `kick_introspect_token` on current `/oauth/token/introspect` | app or user token |

## Webhooks And Events

Kick's Events API uses webhook subscriptions. KickMCP implements:

- `POST /kick/webhooks` for incoming events
- signature verification from `Kick-Event-Message-Id`, `Kick-Event-Message-Timestamp`, raw body, and `Kick-Event-Signature`
- `kick_get_public_key` and `kick_verify_webhook_signature`
- subscription list/create/delete tools

Supported event names in the input schema:

- `chat.message.sent`
- `channel.followed`
- `channel.subscription.renewal`
- `channel.subscription.gifts`
- `channel.subscription.new`
- `channel.reward.redemption.updated`
- `livestream.status.updated`
- `livestream.metadata.updated`
- `moderation.banned`
- `kicks.gifted`

## Not Implemented

These are not implemented because they are not official public API endpoints in the checked docs/OpenAPI:

- historical chat-log retrieval
- websocket chat listening
- poll creation
- predictions
- stream start/stop control
- stream key retrieval

`streamkey:read` is a documented scope, but no matching public stream-key endpoint is present in the checked OpenAPI.

## Auth Notes

App access tokens work for many public reads and event subscription operations. Live testing with local app credentials showed `/public/v1/users?id=...` can return `401 Unauthorized` with only an app token, so user-profile workflows should use a user token with `user:read`.

User access tokens are required for broadcaster-scoped reads/actions and write tools. KickMCP stores OAuth callback tokens in `.kick-tokens.json` and refreshes them automatically when a refresh token is available.

Drops claims are organization-bound. A normal Kick OAuth app can receive an authorization/internal error until the app is associated with the relevant Kick organization.
