# Kick ChatGPT App Spec

## Goal

Build a ChatGPT Apps SDK app named KICK, backed by a developer-ready KickMCP server, that lets ChatGPT inspect Kick data and perform scoped actions through Kick's public OAuth API.

## User-Facing Capabilities

- Show a Kick channel dashboard widget for one or more channel slugs.
- Fetch live stream details for channels.
- Send a Kick chat message as a user or bot when a scoped token is configured.
- Delete a Kick chat message when a scoped moderation token is configured.
- Keep write actions explicit and auditable in the returned tool content.

## Kick API Facts Used

- OAuth host: `https://id.kick.com`.
- API host: `https://api.kick.com`.
- App access token flow uses `POST /oauth/token` with `grant_type=client_credentials`.
- Channel lookup uses `GET /public/v1/channels` and accepts either `slug` or `broadcaster_user_id` query parameters, but not both.
- Livestream lookup uses `GET /public/v1/livestreams`.
- Sending chat uses `POST /public/v1/chat`, requires `chat:write`, and accepts `type`, `content`, optional `broadcaster_user_id`, and optional `reply_to_message_id`.
- Deleting chat uses `DELETE /public/v1/chat/{message_id}` and requires `moderation:chat_message:manage`.

## Acceptance Criteria

- `npm run build` compiles the TypeScript server and bundled widget.
- `npm run typecheck` passes.
- `npm run start` serves an MCP endpoint at `http://localhost:8787/mcp`.
- Secrets are not committed; `.env.example` documents required configuration.
- Tool descriptors include schemas, read/write annotations, and Apps SDK UI metadata.
