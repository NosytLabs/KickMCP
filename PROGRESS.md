# Ralph: KickMCP

## Iteration 1 - 2026-05-21

### Status

Complete.

### What Was Done

- Rebuilt KickMCP as a TypeScript MCP server with stdio and HTTP transports.
- Added Kick app-token API reads, user OAuth callback, stored user-token refresh, token introspection, chat write/delete helpers, webhook receiver, and signature verification.
- Added channel, livestream, livestream stats, category, channel reward, event subscription, Drops, KICKs leaderboard, and moderation tools.
- Added a local `SKILL.md` for agent use.
- Added safe smoke tests and a live read-only examples script.
- Removed separate AI-app positioning and kept the repo focused on MCP and skill workflows.

### Validation

- `npm run typecheck`
- `npm run build`
- `npm run smoke`
- `npm run live:read`

### Files To Check

- `README.md`
- `SKILL.md`
- `docs/setup.md`
- `docs/kick-api-coverage.md`
- `scripts/smoke-test.mjs`
- `scripts/live-read-examples.mjs`
- `src/mcp.ts`
- `src/kick/client.ts`
- `src/kick/oauth.ts`
- `src/server.ts`
