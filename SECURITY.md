# Security Policy

## Secrets

Never commit Kick client secrets, access tokens, refresh tokens, `.env`, or `.kick-tokens.json`.

For any hosted HTTP MCP deployment, set `MCP_REQUIRE_AUTH=true` and `MCP_AUTH_TOKEN` so `/mcp` is not exposed publicly with configured Kick credentials.

Webhook handlers log event metadata only; do not log full webhook bodies in production because chat/user payloads can contain private or sensitive community data. Signed webhook requests are checked for timestamp freshness and duplicate message IDs to reduce replay risk.

## Action Tool Safety

The following tools can change Kick state and should require explicit user confirmation in AI clients:

- `kick_update_channel`
- `kick_send_chat_message`
- `kick_delete_chat_message`
- reward create/update/delete tools
- redemption accept/reject tools
- event subscription create/delete tools
- moderation tools

## Reporting

Open a private security advisory on GitHub or contact the repository owner.
