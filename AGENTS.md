# Project Operations

## Commands

- `npm install` - install dependencies.
- `npm run dev` - run the TypeScript HTTP MCP server locally.
- `npm run build` - bundle widget and compile server.
- `npm run typecheck` - run TypeScript without emitting files.
- `npm run start` - start the compiled server.
- `npm run start:stdio` - start the compiled stdio MCP server for local clients.

## Local Configuration

- Copy `.env.example` to `.env`.
- Fill `KICK_CLIENT_ID` and `KICK_CLIENT_SECRET`.
- Optional write tools use `KICK_USER_ACCESS_TOKEN` or `KICK_BOT_ACCESS_TOKEN`.
- ChatGPT requires HTTPS, so tunnel `http://localhost:8787/mcp` with ngrok or similar when connecting from ChatGPT developer mode.

## Validation

- Run `npm run typecheck` and `npm run build` before sharing changes.
- Do not commit `.env` or Kick secrets.
