import "dotenv/config";

const optional = (name: string) => {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
};

const read = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const readNumber = (name: string, fallback: number) => {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return value;
};

export const config = {
  port: readNumber("PORT", 8787),
  publicBaseUrl: read("PUBLIC_BASE_URL", `http://localhost:${process.env.PORT ?? 8787}`),
  kickApiBaseUrl: read("KICK_API_BASE_URL", "https://api.kick.com"),
  kickOauthBaseUrl: read("KICK_OAUTH_BASE_URL", "https://id.kick.com"),
  kickClientId: process.env.KICK_CLIENT_ID,
  kickClientSecret: process.env.KICK_CLIENT_SECRET,
  kickRequestTimeoutMs: readNumber("KICK_REQUEST_TIMEOUT_MS", 15_000),
  kickRedirectUri: read("KICK_REDIRECT_URI", `http://localhost:${process.env.PORT ?? 8787}/kick/oauth/callback`),
  kickScopes:
    process.env.KICK_SCOPES ??
    "user:read channel:read channel:write channel:rewards:read channel:rewards:write chat:write events:subscribe moderation:ban moderation:chat_message:manage kicks:read",
  kickUserAccessToken: process.env.KICK_USER_ACCESS_TOKEN,
  kickBotAccessToken: process.env.KICK_BOT_ACCESS_TOKEN,
  verifyWebhookSignatures: process.env.KICK_VERIFY_WEBHOOK_SIGNATURES !== "false",
  mcpAuthToken: optional("MCP_AUTH_TOKEN"),
  requireMcpAuth: process.env.MCP_REQUIRE_AUTH === "true" || Boolean(optional("MCP_AUTH_TOKEN")),
};
