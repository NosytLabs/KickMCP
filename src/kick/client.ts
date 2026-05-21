import { config } from "../config.js";
import type {
  KickApiEnvelope,
  KickChannel,
  KickChatResponse,
  KickLivestream,
  KickTokenResponse,
  SendChatInput,
} from "./types.js";
import { readStoredKickTokens } from "./token-store.js";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  query?: URLSearchParams;
};

let cachedAppToken: { token: string; expiresAt: number } | undefined;

export class KickApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "KickApiError";
  }
}

export async function getAppAccessToken() {
  if (cachedAppToken && cachedAppToken.expiresAt > Date.now() + 30_000) {
    return cachedAppToken.token;
  }

  if (!config.kickClientId || !config.kickClientSecret) {
    throw new Error("KICK_CLIENT_ID and KICK_CLIENT_SECRET are required for app access.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.kickClientId,
    client_secret: config.kickClientSecret,
  });

  const response = await fetch(`${config.kickOauthBaseUrl}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json().catch(() => undefined)) as KickTokenResponse | undefined;
  if (!response.ok || !payload?.access_token) {
    throw new KickApiError("Kick app token request failed.", response.status, payload);
  }

  const expiresIn = Number(payload.expires_in || 3600);
  cachedAppToken = {
    token: payload.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return cachedAppToken.token;
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const url = new URL(path, config.kickApiBaseUrl);
  if (options.query) {
    options.query.forEach((value, key) => url.searchParams.append(key, value));
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      accept: "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => undefined)) as KickApiEnvelope<T> | undefined;
  if (!response.ok) {
    throw new KickApiError(payload?.message ?? payload?.error ?? "Kick API request failed.", response.status, payload);
  }

  return (payload?.data ?? payload) as T;
}

export async function getChannels(input: { slugs?: string[]; broadcasterUserIds?: number[] }) {
  if (input.slugs?.length && input.broadcasterUserIds?.length) {
    throw new Error("Kick channel lookup accepts slugs or broadcaster user IDs, not both.");
  }

  const query = new URLSearchParams();
  for (const slug of input.slugs ?? []) query.append("slug", slug);
  for (const id of input.broadcasterUserIds ?? []) query.append("broadcaster_user_id", String(id));

  return request<KickChannel[]>("/public/v1/channels", {
    token: await getAppAccessToken(),
    query,
  });
}

export async function getLivestreams(input: {
  broadcasterUserIds?: number[];
  categoryId?: number;
  language?: string;
  limit?: number;
  sort?: "viewer_count" | "started_at";
}) {
  const query = new URLSearchParams();
  for (const id of input.broadcasterUserIds ?? []) query.append("broadcaster_user_id", String(id));
  if (input.categoryId) query.set("category_id", String(input.categoryId));
  if (input.language) query.set("language", input.language);
  if (input.limit) query.set("limit", String(input.limit));
  if (input.sort) query.set("sort", input.sort);

  return request<KickLivestream[]>("/public/v1/livestreams", {
    token: await getAppAccessToken(),
    query,
  });
}

export async function getUsers(input: { ids?: number[] } = {}) {
  const query = new URLSearchParams();
  for (const id of input.ids ?? []) query.append("id", String(id));
  return request<unknown[]>("/public/v1/users", {
    token: config.kickUserAccessToken ?? readStoredKickTokens()?.access_token ?? (await getAppAccessToken()),
    query,
  });
}

export async function getCategories(input: { names?: string[]; tags?: string[]; ids?: number[]; cursor?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (input.names?.length) query.set("name", input.names.join(","));
  if (input.tags?.length) query.set("tag", input.tags.join(","));
  if (input.ids?.length) query.set("id", input.ids.join(","));
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.limit) query.set("limit", String(input.limit));
  return request<unknown>("/public/v2/categories", {
    token: await getAppAccessToken(),
    query,
  });
}

export async function updateChannel(input: {
  stream_title?: string;
  category_id?: number;
  custom_tags?: string[];
}) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for channel writes.");

  return request<void>("/public/v1/channels", {
    method: "PATCH",
    token,
    body: input,
  });
}

export async function getChannelRewards() {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for channel rewards.");
  return request<unknown[]>("/public/v1/channels/rewards", { token });
}

export async function createChannelReward(input: {
  title: string;
  cost: number;
  description?: string;
  background_color?: string;
  is_enabled?: boolean;
  is_user_input_required?: boolean;
  should_redemptions_skip_request_queue?: boolean;
}) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for channel reward writes.");
  return request<unknown>("/public/v1/channels/rewards", { method: "POST", token, body: input });
}

export async function updateChannelReward(id: string, input: Record<string, unknown>) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for channel reward writes.");
  return request<unknown>(`/public/v1/channels/rewards/${encodeURIComponent(id)}`, { method: "PATCH", token, body: input });
}

export async function deleteChannelReward(id: string) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for channel reward writes.");
  await request<void>(`/public/v1/channels/rewards/${encodeURIComponent(id)}`, { method: "DELETE", token });
}

export async function getRewardRedemptions(input: {
  reward_id?: string;
  status?: "pending" | "accepted" | "rejected";
  ids?: string[];
  cursor?: string;
}) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for reward redemptions.");
  const query = new URLSearchParams();
  if (input.reward_id) query.set("reward_id", input.reward_id);
  if (input.status) query.set("status", input.status);
  for (const id of input.ids ?? []) query.append("id", id);
  if (input.cursor) query.set("cursor", input.cursor);
  return request<unknown>("/public/v1/channels/rewards/redemptions", { token, query });
}

export async function resolveRewardRedemptions(action: "accept" | "reject", ids: string[]) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for reward redemption writes.");
  return request<unknown>(`/public/v1/channels/rewards/redemptions/${action}`, {
    method: "POST",
    token,
    body: { ids },
  });
}

export async function listEventSubscriptions(input: { broadcaster_user_id?: number }) {
  const query = new URLSearchParams();
  if (input.broadcaster_user_id) query.set("broadcaster_user_id", String(input.broadcaster_user_id));
  return request<unknown[]>("/public/v1/events/subscriptions", { token: await getAppAccessToken(), query });
}

export async function createEventSubscriptions(input: {
  broadcaster_user_id?: number;
  events: Array<{ name: string; version: number }>;
  method?: "webhook";
}) {
  return request<unknown[]>("/public/v1/events/subscriptions", {
    method: "POST",
    token: await getAppAccessToken(),
    body: { method: "webhook", ...input },
  });
}

export async function deleteEventSubscriptions(ids: string[]) {
  const query = new URLSearchParams();
  for (const id of ids) query.append("id", id);
  await request<void>("/public/v1/events/subscriptions", {
    method: "DELETE",
    token: await getAppAccessToken(),
    query,
  });
}

export async function getKicksLeaderboard(input: { broadcaster_user_id: number; cursor?: string }) {
  const query = new URLSearchParams({ broadcaster_user_id: String(input.broadcaster_user_id) });
  if (input.cursor) query.set("cursor", input.cursor);
  return request<unknown>("/public/v1/kicks/leaderboard", { token: await getAppAccessToken(), query });
}

export async function moderateBan(input: {
  broadcaster_user_id: number;
  user_id: number;
  duration?: number;
  reason?: string;
}) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for moderation.");
  return request<unknown>("/public/v1/moderation/bans", { method: "POST", token, body: input });
}

export async function removeModerationBan(input: { broadcaster_user_id: number; user_id: number }) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) throw new Error("Missing KICK_USER_ACCESS_TOKEN for moderation.");
  return request<unknown>("/public/v1/moderation/bans", { method: "DELETE", token, body: input });
}

export async function getPublicKey() {
  return request<unknown>("/public/v1/public-key");
}

export async function sendChatMessage(input: SendChatInput) {
  const storedToken = readStoredKickTokens()?.access_token;
  const token =
    input.type === "bot"
      ? config.kickBotAccessToken ?? config.kickUserAccessToken ?? storedToken
      : config.kickUserAccessToken ?? storedToken;
  if (!token) {
    throw new Error(`Missing ${input.type === "bot" ? "KICK_BOT_ACCESS_TOKEN or " : ""}KICK_USER_ACCESS_TOKEN for chat writes.`);
  }

  return request<KickChatResponse>("/public/v1/chat", {
    method: "POST",
    token,
    body: input,
  });
}

export async function deleteChatMessage(messageId: string) {
  const token = config.kickUserAccessToken ?? readStoredKickTokens()?.access_token;
  if (!token) {
    throw new Error("Missing KICK_USER_ACCESS_TOKEN for chat moderation.");
  }

  await request<void>(`/public/v1/chat/${encodeURIComponent(messageId)}`, {
    method: "DELETE",
    token,
  });
}
