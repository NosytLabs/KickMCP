# Official Source Notes

This project is implemented against:

- `https://docs.kick.com`
- `https://github.com/KickEngineering/KickDevDocs`
- `https://api.kick.com/swagger/doc.yaml`

Current official endpoint groups represented in tools:

- `/oauth/token`
- `/oauth/token/introspect`
- `/public/v1/users`
- `/public/v1/channels`
- `/public/v1/livestreams`
- `/public/v1/livestreams/stats`
- `/public/v2/categories`
- `/public/v1/categories` and `/public/v1/categories/{category_id}` as deprecated compatibility tools
- `/public/v1/chat`
- `/public/v1/channels/rewards`
- `/public/v1/channels/rewards/redemptions`
- `/public/v1/events/subscriptions`
- `/public/v1/drops/claims` from the Drops guide
- `/public/v1/kicks/leaderboard`
- `/public/v1/moderation/bans`
- `/public/v1/public-key`

## Product Positioning

KickMCP is an unofficial developer/streamer MCP server and local skill. It should be presented as a tool for users who bring their own Kick OAuth app credentials.

## Branding

Do not present this as an official Kick product unless the owner has explicit brand permission. Use `KickMCP` or `Unofficial Kick MCP` naming in directories, docs, and package metadata.

## Real-Time And Chat

Kick's official real-time model is event subscriptions delivered by webhooks. KickMCP does not implement an unofficial websocket client and does not claim historical chat-log retrieval.
