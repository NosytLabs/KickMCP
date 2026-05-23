# Live Read Examples

Run:

```bash
npm run live:read
```

The script prints live read-only examples from the configured Kick OAuth app credentials. It never prints client secrets, access tokens, or refresh tokens.

Snapshot from 2026-05-23 using local Kick app credentials:

```json
{
  "timestamp": "2026-05-23T19:46:49.881Z",
  "top_livestream_slugs": ["korekore_ch", "maherco", "eray"],
  "livestream_stats": {
    "total_count": 14122
  },
  "event_subscriptions": [],
  "label": "app_token_introspection",
  "ok": true,
  "result": {
    "active": true,
    "client_id": "01JRS1ZAJ3GDR3FFAHSK5W8GXY",
    "token_type": "app"
  }
}
```

Examples that succeeded in live testing:

- top livestream read with `kick_get_livestreams`
- channel lookup by live slug with `kick_get_channels`
- category search through `/public/v2/categories`
- deprecated category search/detail compatibility checks
- livestream aggregate stats
- event subscription listing
- public key retrieval
- app token introspection

Expected auth boundaries observed:

- `kick_get_users` with only an app token can return `401 Unauthorized`; use a user token with `user:read` for reliable profile reads.
- `kick_get_drops_claims` can return an authorization/internal boundary error unless the OAuth app is associated with the relevant Kick organization.
- reward, KICKs leaderboard, channel update, chat write, and moderation tools require a user or bot token with matching scopes.

Do not paste live access tokens into this file. If you need repeatable examples in docs, use sanitized fields like slugs, IDs, category names, counts, and boolean status.
