# Kick Docs Analysis

Sources reviewed:

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

## Auth Model

Kick has two useful token classes for this project:

- App access tokens from `client_credentials`, used for public/server-to-server reads and event subscription operations that allow app tokens.
- User access tokens from authorization code + PKCE, used for user/broadcaster-scoped reads and actions.

The OAuth host is `https://id.kick.com`, which is separate from the API host `https://api.kick.com`.

## Tool Coverage Decision

KickMCP should expose the broad developer surface at `/mcp` because developers need full API control. The curated `/chatgpt/mcp` profile should remain smaller because broad consumer app experiences should not default-expose delete, moderation, webhook administration, public-key plumbing, or reward mutation tools.

## Channel Rewards

Official endpoints:

- `GET /public/v1/channels/rewards`
- `POST /public/v1/channels/rewards`
- `PATCH /public/v1/channels/rewards/{id}`
- `DELETE /public/v1/channels/rewards/{id}`
- `GET /public/v1/channels/rewards/redemptions`
- `POST /public/v1/channels/rewards/redemptions/accept`
- `POST /public/v1/channels/rewards/redemptions/reject`

Important implementation details:

- Rewards require user access tokens.
- Read can use `channel:rewards:read` or `channel:rewards:write`.
- Writes require `channel:rewards:write`.
- Accept/reject redemptions take up to 25 unique IDs per request.
- Only the app that created a reward can update/delete that reward.

## Events And Webhooks

The Events API supports webhook subscriptions. Kick docs say app access tokens can subscribe to events for any channel when a broadcaster user ID is supplied.

Configured webhook URL must be public. Localhost only works through a public tunnel such as ngrok or Cloudflare Tunnel.

Webhook event types currently represented in schemas:

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

Webhook signature verification uses:

- `Kick-Event-Message-Id`
- `Kick-Event-Message-Timestamp`
- raw request body
- `Kick-Event-Signature`
- Kick public key from `GET /public/v1/public-key`

Kick may unsubscribe an app from events if the webhook continually fails for over a day, so handlers should return quickly.

## Public Key

`GET /public/v1/public-key` returns the public key used to verify webhook signatures. This belongs in the developer MCP profile. It should not be a prominent curated-app tool.

## Drops

Drops are primarily an organization/developer-dashboard workflow:

- Organization owners create/manage Drops campaigns.
- Campaigns can attach up to 12 rewards.
- Viewers earn rewards by watching participating streams.
- Kick sends a synchronous claim webhook when a reward is claimed.
- Claim webhooks should be idempotent by `claim_id`.

The Drops guide documents:

- `GET /public/v1/drops/claims`

This endpoint requires app access tokens from OAuth apps associated with the organization. It is implemented as `kick_get_drops_claims`, but smoke tests tolerate authorization errors when the configured app is not associated with a Kick organization.

## Scope Notes

Relevant scopes:

- `user:read`
- `channel:read`
- `channel:write`
- `channel:rewards:read`
- `channel:rewards:write`
- `chat:write`
- `events:subscribe`
- `moderation:ban`
- `moderation:chat_message:manage`
- `kicks:read`

`streamkey:read` exists in the docs, but this repo does not expose a stream-key tool yet because the current implemented surface was focused on the API groups already mapped and tested.

## Known Non-Goals

Do not claim support for these unless Kick adds official docs/endpoints:

- Polls
- Predictions
- Stream start/stop control
- Unofficial websocket chat listening

## Current Implementation Status

Implemented:

- OAuth app-token flow
- OAuth authorization-code + PKCE callback helper
- users/channels/livestreams/categories
- chat send/delete
- channel rewards CRUD
- reward redemptions read/accept/reject
- event subscription list/create/delete
- webhook receiver with signature verification
- public key retrieval
- KICKs leaderboard for authenticated broadcaster
- Drops claims retrieval for organization-associated OAuth apps

Validated by `npm run smoke` with app credentials:

- tool profile sizes
- livestream lookup
- channel lookup
- category lookup
- public key retrieval
- event subscription listing
- clear errors for user-token-gated tools when no user token is present

Not automatically executed in smoke tests:

- chat sends
- deletes
- moderation actions
- reward mutations
- event subscription mutations

Those tools mutate Kick state and require explicit human confirmation plus suitable test fixtures.
