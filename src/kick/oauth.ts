import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { readStoredKickTokens, writeStoredKickTokens } from "./token-store.js";
import type { StoredKickTokens } from "./token-store.js";

type PkceSession = {
  codeVerifier: string;
  createdAt: number;
};

const sessions = new Map<string, PkceSession>();
const sessionTtlMs = 10 * 60 * 1000;

function pruneExpiredSessions(now = Date.now()) {
  for (const [state, session] of sessions) {
    if (now - session.createdAt > sessionTtlMs) {
      sessions.delete(state);
    }
  }
}

function base64Url(buffer: Buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createCodeVerifier() {
  return base64Url(randomBytes(48));
}

function createCodeChallenge(verifier: string) {
  return base64Url(createHash("sha256").update(verifier).digest());
}

function requestSignal() {
  return AbortSignal.timeout(config.kickRequestTimeoutMs);
}

export function createKickAuthorizationUrl() {
  if (!config.kickClientId) {
    throw new Error("KICK_CLIENT_ID is required to start Kick OAuth.");
  }

  pruneExpiredSessions();
  const state = randomBytes(16).toString("hex");
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  sessions.set(state, { codeVerifier, createdAt: Date.now() });

  const url = new URL("/oauth/authorize", config.kickOauthBaseUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.kickClientId);
  url.searchParams.set("redirect_uri", config.kickRedirectUri);
  url.searchParams.set("scope", config.kickScopes);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeKickAuthorizationCode(code: string, state: string) {
  const session = sessions.get(state);
  sessions.delete(state);

  if (!session || Date.now() - session.createdAt > sessionTtlMs) {
    throw new Error("Kick OAuth state is invalid or expired. Start the OAuth flow again.");
  }

  if (!config.kickClientId || !config.kickClientSecret) {
    throw new Error("KICK_CLIENT_ID and KICK_CLIENT_SECRET are required for Kick OAuth.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.kickClientId,
    client_secret: config.kickClientSecret,
    redirect_uri: config.kickRedirectUri,
    code_verifier: session.codeVerifier,
    code,
  });

  const response = await fetch(`${config.kickOauthBaseUrl}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: requestSignal(),
  });

  const payload = (await response.json().catch(() => undefined)) as Omit<StoredKickTokens, "saved_at"> | undefined;
  if (!response.ok || !payload?.access_token) {
    throw new Error(`Kick OAuth token exchange failed with status ${response.status}.`);
  }

  return writeStoredKickTokens(payload);
}

export async function refreshStoredKickTokens() {
  const stored = readStoredKickTokens();
  if (!stored?.refresh_token) {
    throw new Error("Stored Kick user token is expired and no refresh token is available. Start /kick/oauth/start again.");
  }

  if (!config.kickClientId || !config.kickClientSecret) {
    throw new Error("KICK_CLIENT_ID and KICK_CLIENT_SECRET are required to refresh Kick OAuth tokens.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.kickClientId,
    client_secret: config.kickClientSecret,
    redirect_uri: config.kickRedirectUri,
    refresh_token: stored.refresh_token,
  });

  const response = await fetch(`${config.kickOauthBaseUrl}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: requestSignal(),
  });

  const payload = (await response.json().catch(() => undefined)) as Omit<StoredKickTokens, "saved_at"> | undefined;
  if (!response.ok || !payload?.access_token) {
    throw new Error(`Kick OAuth refresh failed with status ${response.status}. Start /kick/oauth/start again.`);
  }

  return writeStoredKickTokens(payload);
}
