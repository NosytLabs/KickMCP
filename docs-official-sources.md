# Official Source Notes

This project is implemented against:

- `https://docs.kick.com`
- `https://github.com/KickEngineering/KickDevDocs`
- `https://api.kick.com/swagger/doc.yaml`

Current official endpoint groups represented in tools:

- `/public/v1/users`
- `/public/v1/channels`
- `/public/v2/categories`
- `/public/v1/livestreams`
- `/public/v1/chat`
- `/public/v1/channels/rewards`
- `/public/v1/channels/rewards/redemptions`
- `/public/v1/events/subscriptions`
- `/public/v1/drops/claims` from the Drops guide
- `/public/v1/kicks/leaderboard`
- `/public/v1/moderation/bans`
- `/public/v1/public-key`

Deprecated category endpoints under `/public/v1/categories` are not used.

## Product Profiles

The developer MCP profile at `/mcp` exposes the full official Kick API tool surface implemented by this repo.

The curated AI app profile at `/chatgpt/mcp` intentionally exposes a smaller creator-facing set:

- profile/channel/livestream/category reads
- channel metadata update
- explicit chat send
- reward/redemption reads
- KICKs leaderboard reads

It intentionally excludes moderation, deletion, webhook administration, public-key plumbing, and reward mutation from the public app surface. Those tools are developer/admin tools, not broad consumer app defaults.

## Branding

This repository should be presented as an unofficial Kick developer integration unless the owner has explicit permission to use official Kick branding in app directories or ChatGPT app submission.

## Recommended Audience Split

KickMCP is best published as a developer/streamer MCP server, not an official Kick ChatGPT app. The repo should help people add it themselves to MCP clients and use the curated profile when they want a safer app-like surface.
