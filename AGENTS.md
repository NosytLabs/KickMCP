# Project Operations

## Commands

- `npm install` - install dependencies.
- `npm run dev` - run the TypeScript HTTP MCP server locally.
- `npm run typecheck` - run TypeScript without emitting files.
- `npm run build` - compile the server.
- `npm run smoke` - build, start an isolated server, and run safe live checks.
- `npm run live:read` - print sanitized read-only live API examples.
- `npm run start` - start the compiled HTTP MCP server.
- `npm run start:stdio` - start the compiled stdio MCP server for local clients.

## Local Configuration

- Copy `.env.example` to `.env`.
- Fill `KICK_CLIENT_ID` and `KICK_CLIENT_SECRET`.
- Optional broadcaster/write tools use `KICK_USER_ACCESS_TOKEN`, `.kick-tokens.json`, or `KICK_BOT_ACCESS_TOKEN`.
- HTTP MCP clients connect to `http://localhost:8787/mcp`.

## Validation

- Run `npm run typecheck`, `npm run smoke`, and `npm run live:read` before claiming the repo works.
- Do not commit `.env`, `.kick-tokens.json`, Kick secrets, access tokens, or refresh tokens.
