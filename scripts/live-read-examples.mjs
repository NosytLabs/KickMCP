import {
  getCategories,
  getCategoryDetail,
  getChannels,
  getDropsClaims,
  getLegacyCategories,
  getLivestreams,
  getLivestreamStats,
  getPublicKey,
  getUsers,
  introspectKickToken,
  listEventSubscriptions,
} from "../dist/kick/client.js";

async function capture(label, run, { expectError = false } = {}) {
  try {
    const result = await run();
    console.log(JSON.stringify({ label, ok: true, result }, null, 2));
  } catch (error) {
    const payload = {
      label,
      ok: false,
      expected: expectError,
      error: error instanceof Error ? error.message : String(error),
      status: typeof error === "object" && error && "status" in error ? error.status : undefined,
    };
    console.log(JSON.stringify(payload, null, 2));
    if (!expectError) process.exitCode = 1;
  }
}

const livestreams = await getLivestreams({ limit: 3, sort: "viewer_count" });
const firstLive = livestreams[0];

console.log(`# KickMCP live read examples`);
console.log(`# Timestamp: ${new Date().toISOString()}`);
console.log(`# Secrets are never printed. Results are live and will change.`);

await capture("livestreams_top_3", async () =>
  livestreams.map((stream) => ({
    slug: stream.slug,
    broadcaster_user_id: stream.broadcaster_user_id,
    stream_title: stream.stream_title,
    viewer_count: stream.viewer_count,
    category: stream.category?.name,
    started_at: stream.started_at,
  })),
);

if (firstLive?.slug) {
  await capture("channel_by_live_slug", async () =>
    (await getChannels({ slugs: [firstLive.slug] })).map((channel) => ({
      slug: channel.slug,
      broadcaster_user_id: channel.broadcaster_user_id,
      stream_title: channel.stream_title,
      active_subscribers_count: channel.active_subscribers_count,
      category: channel.category?.name,
    })),
  );
}

await capture("categories_v2_just_chatting", async () => getCategories({ names: ["Just Chatting"], limit: 3 }));
await capture("legacy_categories_v1_just_chatting", async () => getLegacyCategories({ q: "Just Chatting", page: 1 }));
await capture("category_detail_15", async () => getCategoryDetail(15));
await capture("livestream_stats", async () => getLivestreamStats());
await capture("event_subscriptions", async () => listEventSubscriptions({}));
await capture("public_key_presence", async () => {
  const publicKey = await getPublicKey();
  return {
    has_public_key: Boolean(publicKey && typeof publicKey === "object" && "public_key" in publicKey),
    prefix: String(publicKey && typeof publicKey === "object" && "public_key" in publicKey ? publicKey.public_key : "").slice(0, 30),
  };
});
await capture("app_token_introspection", async () => {
  const token = await introspectKickToken({ token_source: "app" });
  return token && typeof token === "object"
    ? {
        active: token.active,
        client_id: token.client_id,
        token_type: token.token_type,
        exp: token.exp,
        scope: token.scope,
      }
    : token;
});

if (firstLive?.broadcaster_user_id) {
  await capture("users_with_app_token_expected_auth_boundary", async () => getUsers({ ids: [firstLive.broadcaster_user_id] }), { expectError: true });
}

await capture("drops_claims_expected_org_boundary", async () => getDropsClaims({ limit: 1 }), { expectError: true });
