import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export type StoredKickTokens = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number | string;
  expires_at?: string;
  scope?: string;
  saved_at: string;
};

const tokenPath = path.resolve(process.cwd(), ".kick-tokens.json");

export function readStoredKickTokens() {
  if (!existsSync(tokenPath)) return undefined;
  try {
    return JSON.parse(readFileSync(tokenPath, "utf8")) as StoredKickTokens;
  } catch (error) {
    throw new Error(`Unable to read .kick-tokens.json. Delete it and restart OAuth if it is corrupted. Cause: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function writeStoredKickTokens(tokens: Omit<StoredKickTokens, "saved_at">) {
  const savedAt = new Date();
  const expiresIn = Number(tokens.expires_in);
  const payload: StoredKickTokens = {
    ...tokens,
    saved_at: savedAt.toISOString(),
    expires_at: Number.isFinite(expiresIn) ? new Date(savedAt.getTime() + expiresIn * 1000).toISOString() : tokens.expires_at,
  };
  const temporaryPath = `${tokenPath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporaryPath, tokenPath);
  return payload;
}
