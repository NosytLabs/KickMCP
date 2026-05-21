import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { writeStoredKickTokens } from "./token-store.js";
import type { StoredKickTokens } from "./token-store.js";

type PkceSession = {
  codeVerifier: string;
  createdAt: number;
};

const sessions = new Map<string, PkceSession>();

function base64Url(buffer: Buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createCodeVerifier() {
  return base64Url(randomBytes(48));
}

function createCodeChallenge(verifier: string) {
  return base64Url(createHash("sha256").update(verifier).digest());
}

export function createKickAuthorizationUrl() {
  if (!config.kickClientId) {
    throw new Error("KICK_CLIENT_ID is required to start Kick OAuth.");
  }

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

  if (!session || Date.now() - session.createdAt > 10 * 60 * 1000) {
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
  });

  const payload = (await response.json().catch(() => undefined)) as Omit<StoredKickTokens, "saved_at"> | undefined;
  if (!response.ok || !payload?.access_token) {
    throw new Error(`Kick OAuth token exchange failed with status ${response.status}.`);
  }

  return writeStoredKickTokens(payload);
}

