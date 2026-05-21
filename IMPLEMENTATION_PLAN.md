# Implementation Plan

## Completed

- [x] Rebuild KickMCP as an unofficial MCP-first server.
- [x] Implement stdio and Streamable HTTP transports.
- [x] Implement Kick app-token reads, user OAuth callback, stored token refresh, webhook receiver, and signature verification.
- [x] Cover current Kick public API groups represented in the official docs/OpenAPI.
- [x] Add smoke tests and live read-only example script.
- [x] Remove separate AI-app positioning and keep one `/mcp` server surface.

## Backlog

- [ ] Add persistent webhook event storage examples for chat analytics.
- [ ] Add optional database-backed token storage for hosted deployments.
- [ ] Publish npm package after final owner review.
