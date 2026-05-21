# Security Policy

## Secrets

Never commit Kick client secrets, access tokens, refresh tokens, `.env`, or `.kick-tokens.json`.

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

