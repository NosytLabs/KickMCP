import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";
import {
  createChannelReward,
  createEventSubscriptions,
  deleteChannelReward,
  deleteChatMessage,
  deleteEventSubscriptions,
  getCategories,
  getChannelRewards,
  getChannels,
  getDropsClaims,
  getKicksLeaderboard,
  getLivestreams,
  getPublicKey,
  getRewardRedemptions,
  getUsers,
  listEventSubscriptions,
  moderateBan,
  removeModerationBan,
  resolveRewardRedemptions,
  sendChatMessage,
  updateChannel,
  updateChannelReward,
  verifyWebhookSignature,
} from "./kick/client.js";
import {
  createKickEventsInput,
  createKickRewardInput,
  deleteKickChatInput,
  deleteKickChatOutput,
  deleteKickEventsInput,
  emptyInput,
  genericDataOutput,
  getKickCategoriesInput,
  getKickChannelInput,
  getKickChannelOutput,
  getKickDropsClaimsInput,
  getKickKicksLeaderboardInput,
  getKickLivestreamsInput,
  getKickLivestreamsOutput,
  getKickRedemptionsInput,
  getKickUsersInput,
  getKickUsersOutput,
  listKickEventsInput,
  moderateKickUserInput,
  resolveKickRedemptionsInput,
  rewardIdInput,
  sendKickChatInput,
  sendKickChatOutput,
  unmoderateKickUserInput,
  updateKickChannelInput,
  updateKickRewardInput,
  verifyKickWebhookSignatureInput,
  verifyKickWebhookSignatureOutput,
} from "./tool-schemas.js";
import { widgetCss } from "./widget/styles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDGET_URI = "ui://widget/kick-v1.html";
const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";

export type KickMcpProfile = "developer" | "chatgpt";

function loadWidgetJs() {
  return readFileSync(path.resolve(__dirname, "../web-dist/widget.js"), "utf8");
}

function text(message: string) {
  return [{ type: "text" as const, text: message }];
}

function meta(invoking: string, invoked: string, visible = true) {
  return {
    ui: visible ? { resourceUri: WIDGET_URI, visibility: ["model", "app"] } : undefined,
    "openai/outputTemplate": visible ? WIDGET_URI : undefined,
    "openai/toolInvocation/invoking": invoking,
    "openai/toolInvocation/invoked": invoked,
  };
}

export function createMcpServer(options: { profile?: KickMcpProfile } = {}) {
  const profile = options.profile ?? "developer";
  const isDeveloperProfile = profile === "developer";
  const server = new McpServer({ name: profile === "chatgpt" ? "kick-chatgpt-app" : "kick", version: "1.0.0" });

  server.registerResource("kick-widget", WIDGET_URI, {}, async () => ({
    contents: [
      {
        uri: WIDGET_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: `<div id="root"></div><style>${widgetCss}</style><script type="module">${loadWidgetJs()}</script>`,
        _meta: {
          ui: {
            prefersBorder: true,
            domain: config.publicBaseUrl,
            csp: {
              connectDomains: [config.publicBaseUrl, config.kickApiBaseUrl],
              resourceDomains: [config.publicBaseUrl, "https://images.kick.com", "https://files.kick.com"],
            },
          },
          "openai/widgetDescription":
            profile === "chatgpt"
              ? "KICK creator dashboard for channel, livestream, rewards, KICKs, and approved chat actions."
              : "KICK developer dashboard for channel, livestream, chat, moderation, rewards, and webhook tool results.",
        },
      },
    ],
  }));

  server.registerTool(
    "kick_get_users",
    {
      title: "Get Authenticated Kick User",
      description: "Return Kick user profiles by ID, or the authenticated user when no IDs are supplied. Requires user:read for user access tokens; app tokens can read public user data.",
      inputSchema: getKickUsersInput,
      outputSchema: getKickUsersOutput,
      annotations: { readOnlyHint: true },
      _meta: meta("Loading Kick user", "Kick user loaded", false),
    },
    async ({ ids }) => {
      const users = await getUsers({ ids });
      return { structuredContent: { users }, content: text(`Loaded ${users.length} authenticated Kick user record(s).`) };
    },
  );

  server.registerTool(
    "kick_get_channels",
    {
      title: "Get Kick Channels",
      description: "Look up Kick channel information by channel slug or broadcaster user ID. Do not mix slugs and IDs.",
      inputSchema: getKickChannelInput,
      outputSchema: getKickChannelOutput,
      annotations: { readOnlyHint: true },
      _meta: meta("Loading Kick channels", "Kick channels loaded"),
    },
    async ({ slugs, broadcasterUserIds }) => {
      const channels = await getChannels({ slugs, broadcasterUserIds });
      return { structuredContent: { channels }, content: text(`Loaded ${channels.length} Kick channel(s).`) };
    },
  );

  server.registerTool(
    "kick_get_livestreams",
    {
      title: "Get Kick Livestreams",
      description: "Fetch current Kick livestreams, optionally filtered by broadcaster user ID, category, language, limit, or sort.",
      inputSchema: getKickLivestreamsInput,
      outputSchema: getKickLivestreamsOutput,
      annotations: { readOnlyHint: true },
      _meta: meta("Loading Kick livestreams", "Kick livestreams loaded"),
    },
    async ({ broadcasterUserIds, categoryId, language, limit, sort }) => {
      const livestreams = await getLivestreams({ broadcasterUserIds, categoryId, language, limit, sort });
      return { structuredContent: { livestreams }, content: text(`Loaded ${livestreams.length} Kick livestream(s).`) };
    },
  );

  server.registerTool(
    "kick_get_categories",
    {
      title: "Get Kick Categories",
      description: "Get Kick categories from the current /public/v2/categories endpoint by names, tags, IDs, cursor, and limit.",
      inputSchema: getKickCategoriesInput,
      outputSchema: genericDataOutput,
      annotations: { readOnlyHint: true },
      _meta: meta("Searching Kick categories", "Kick categories loaded", false),
    },
    async ({ names, tags, ids, cursor, limit }) => {
      const data = await getCategories({ names, tags, ids, cursor, limit });
      return { structuredContent: { data }, content: text("Loaded Kick categories.") };
    },
  );

  server.registerTool(
    "kick_update_channel",
    {
      title: "Update Kick Channel",
      description: "Update the authenticated user's Kick livestream title, category, or custom tags. Requires channel:write and explicit user approval.",
      inputSchema: updateKickChannelInput,
      outputSchema: genericDataOutput,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      _meta: meta("Updating Kick channel", "Kick channel updated", false),
    },
    async (input) => {
      await updateChannel(input);
      return { structuredContent: { data: { updated: true } }, content: text("Updated Kick channel metadata.") };
    },
  );

  server.registerTool(
    "kick_send_chat_message",
    {
      title: "Send Kick Chat Message",
      description: "Send a Kick chat message as user or bot. Requires chat:write and explicit approval of exact message text.",
      inputSchema: sendKickChatInput,
      outputSchema: sendKickChatOutput,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      _meta: meta("Sending Kick chat", "Kick chat sent"),
    },
    async (input) => {
      if (input.type === "user" && !input.broadcaster_user_id) {
        throw new Error("broadcaster_user_id is required when sending chat as a user.");
      }
      const response = await sendChatMessage(input);
      return { structuredContent: response, content: text(response.is_sent ? "Sent Kick chat message." : "Kick did not confirm the chat send.") };
    },
  );

  if (!isDeveloperProfile) {
    server.registerTool("kick_get_channel_rewards", {
      title: "Get Kick Channel Rewards",
      description: "List rewards for the authenticated broadcaster's channel. Requires channel:rewards:read or channel:rewards:write.",
      inputSchema: emptyInput,
      outputSchema: genericDataOutput,
      annotations: { readOnlyHint: true },
      _meta: meta("Loading Kick rewards", "Kick rewards loaded", false),
    }, async () => ({ structuredContent: { data: await getChannelRewards() }, content: text("Loaded Kick channel rewards.") }));

    server.registerTool("kick_get_reward_redemptions", {
      title: "Get Kick Reward Redemptions",
      description: "List reward redemptions for the authenticated broadcaster's channel.",
      inputSchema: getKickRedemptionsInput,
      outputSchema: genericDataOutput,
      annotations: { readOnlyHint: true },
      _meta: meta("Loading Kick redemptions", "Kick redemptions loaded", false),
    }, async (input) => ({ structuredContent: { data: await getRewardRedemptions(input) }, content: text("Loaded Kick reward redemptions.") }));

    server.registerTool("kick_get_kicks_leaderboard", {
      title: "Get KICKs Leaderboard",
      description: "Get KICKs leaderboard data for the authenticated broadcaster. Requires a user token with kicks:read.",
      inputSchema: getKickKicksLeaderboardInput,
      outputSchema: genericDataOutput,
      annotations: { readOnlyHint: true },
      _meta: meta("Loading KICKs leaderboard", "KICKs leaderboard loaded", false),
    }, async (input) => ({ structuredContent: { data: await getKicksLeaderboard(input) }, content: text("Loaded KICKs leaderboard.") }));

    return server;
  }

  server.registerTool(
    "kick_delete_chat_message",
    {
      title: "Delete Kick Chat Message",
      description: "Delete a Kick chat message by message ID. Requires moderation:chat_message:manage and explicit user confirmation.",
      inputSchema: deleteKickChatInput,
      outputSchema: deleteKickChatOutput,
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
      _meta: meta("Deleting Kick chat", "Kick chat deleted"),
    },
    async ({ message_id }) => {
      await deleteChatMessage(message_id);
      return { structuredContent: { deleted: true, message_id }, content: text(`Deleted Kick chat message ${message_id}.`) };
    },
  );

  server.registerTool("kick_get_channel_rewards", {
    title: "Get Kick Channel Rewards",
    description: "List rewards for the authenticated broadcaster's channel. Requires channel:rewards:read or channel:rewards:write.",
    inputSchema: emptyInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: true },
    _meta: meta("Loading Kick rewards", "Kick rewards loaded", false),
  }, async () => ({ structuredContent: { data: await getChannelRewards() }, content: text("Loaded Kick channel rewards.") }));

  server.registerTool("kick_create_channel_reward", {
    title: "Create Kick Channel Reward",
    description: "Create a channel reward. Requires channel:rewards:write and explicit approval.",
    inputSchema: createKickRewardInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    _meta: meta("Creating Kick reward", "Kick reward created", false),
  }, async (input) => ({ structuredContent: { data: await createChannelReward(input) }, content: text("Created Kick channel reward.") }));

  server.registerTool("kick_update_channel_reward", {
    title: "Update Kick Channel Reward",
    description: "Update a channel reward created by this app. Requires channel:rewards:write and explicit approval.",
    inputSchema: updateKickRewardInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    _meta: meta("Updating Kick reward", "Kick reward updated", false),
  }, async ({ id, ...input }) => ({ structuredContent: { data: await updateChannelReward(id, input) }, content: text(`Updated Kick reward ${id}.`) }));

  server.registerTool("kick_delete_channel_reward", {
    title: "Delete Kick Channel Reward",
    description: "Delete a channel reward created by this app. Requires channel:rewards:write and explicit confirmation.",
    inputSchema: rewardIdInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    _meta: meta("Deleting Kick reward", "Kick reward deleted", false),
  }, async ({ id }) => {
    await deleteChannelReward(id);
    return { structuredContent: { data: { deleted: true, id } }, content: text(`Deleted Kick reward ${id}.`) };
  });

  server.registerTool("kick_get_reward_redemptions", {
    title: "Get Kick Reward Redemptions",
    description: "List reward redemptions for the authenticated broadcaster's channel.",
    inputSchema: getKickRedemptionsInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: true },
    _meta: meta("Loading Kick redemptions", "Kick redemptions loaded", false),
  }, async (input) => ({ structuredContent: { data: await getRewardRedemptions(input) }, content: text("Loaded Kick reward redemptions.") }));

  for (const action of ["accept", "reject"] as const) {
    server.registerTool(`kick_${action}_reward_redemptions`, {
      title: `${action === "accept" ? "Accept" : "Reject"} Kick Reward Redemptions`,
      description: `${action === "accept" ? "Accept" : "Reject"} one or more channel reward redemptions. Requires channel:rewards:write and explicit approval.`,
      inputSchema: resolveKickRedemptionsInput,
      outputSchema: genericDataOutput,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      _meta: meta(`${action === "accept" ? "Accepting" : "Rejecting"} Kick redemptions`, `Kick redemptions ${action}ed`, false),
    }, async ({ ids }) => ({ structuredContent: { data: await resolveRewardRedemptions(action, ids) }, content: text(`${action}ed ${ids.length} Kick redemption(s).`) }));
  }

  server.registerTool("kick_list_event_subscriptions", {
    title: "List Kick Event Subscriptions",
    description: "List webhook event subscriptions. Uses app access token.",
    inputSchema: listKickEventsInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: true },
    _meta: meta("Loading Kick event subscriptions", "Kick event subscriptions loaded", false),
  }, async (input) => ({ structuredContent: { data: await listEventSubscriptions(input) }, content: text("Loaded Kick event subscriptions.") }));

  server.registerTool("kick_get_drops_claims", {
    title: "Get Kick Drops Claims",
    description: "Get Drops reward claims for organization-associated OAuth apps. Requires app credentials associated with the organization.",
    inputSchema: getKickDropsClaimsInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: true },
    _meta: meta("Loading Kick Drops claims", "Kick Drops claims loaded", false),
  }, async (input) => ({ structuredContent: { data: await getDropsClaims(input) }, content: text("Loaded Kick Drops claims.") }));

  server.registerTool("kick_verify_webhook_signature", {
    title: "Verify Kick Webhook Signature",
    description: "Verify a Kick webhook signature using Kick-Event-Message-Id, Kick-Event-Message-Timestamp, raw body, and Kick-Event-Signature.",
    inputSchema: verifyKickWebhookSignatureInput,
    outputSchema: verifyKickWebhookSignatureOutput,
    annotations: { readOnlyHint: true },
    _meta: meta("Verifying Kick webhook", "Kick webhook verified", false),
  }, async (input) => {
    const result = await verifyWebhookSignature(input);
    return { structuredContent: result, content: text(result.verified ? "Kick webhook signature is valid." : "Kick webhook signature is invalid.") };
  });

  server.registerTool("kick_create_event_subscriptions", {
    title: "Create Kick Event Subscriptions",
    description: "Create Kick webhook event subscriptions. Requires a webhook URL configured in the Kick app and explicit approval.",
    inputSchema: createKickEventsInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    _meta: meta("Creating Kick event subscriptions", "Kick event subscriptions created", false),
  }, async (input) => ({ structuredContent: { data: await createEventSubscriptions(input) }, content: text("Created Kick event subscriptions.") }));

  server.registerTool("kick_delete_event_subscriptions", {
    title: "Delete Kick Event Subscriptions",
    description: "Delete Kick event subscriptions by ID. Requires explicit confirmation.",
    inputSchema: deleteKickEventsInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    _meta: meta("Deleting Kick event subscriptions", "Kick event subscriptions deleted", false),
  }, async ({ ids }) => {
    await deleteEventSubscriptions(ids);
    return { structuredContent: { data: { deleted: true, ids } }, content: text(`Deleted ${ids.length} Kick event subscription(s).`) };
  });

  server.registerTool("kick_get_kicks_leaderboard", {
    title: "Get KICKs Leaderboard",
    description: "Get KICKs leaderboard data for the authenticated broadcaster. Requires a user token with kicks:read.",
    inputSchema: getKickKicksLeaderboardInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: true },
    _meta: meta("Loading KICKs leaderboard", "KICKs leaderboard loaded", false),
  }, async (input) => ({ structuredContent: { data: await getKicksLeaderboard(input) }, content: text("Loaded KICKs leaderboard.") }));

  server.registerTool("kick_ban_or_timeout_user", {
    title: "Ban Or Timeout Kick User",
    description: "Ban a user, or timeout them when duration is provided. Requires moderation:ban and explicit approval.",
    inputSchema: moderateKickUserInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    _meta: meta("Applying Kick moderation", "Kick moderation applied", false),
  }, async (input) => ({ structuredContent: { data: await moderateBan(input) }, content: text("Applied Kick moderation action.") }));

  server.registerTool("kick_unban_user", {
    title: "Unban Kick User",
    description: "Remove a Kick ban or timeout. Requires moderation:ban and explicit approval.",
    inputSchema: unmoderateKickUserInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    _meta: meta("Removing Kick moderation", "Kick moderation removed", false),
  }, async (input) => ({ structuredContent: { data: await removeModerationBan(input) }, content: text("Removed Kick moderation action.") }));

  server.registerTool("kick_get_public_key", {
    title: "Get Kick Public Key",
    description: "Fetch Kick's public key for webhook signature verification.",
    inputSchema: emptyInput,
    outputSchema: genericDataOutput,
    annotations: { readOnlyHint: true },
    _meta: meta("Loading Kick public key", "Kick public key loaded", false),
  }, async () => ({ structuredContent: { data: await getPublicKey() }, content: text("Loaded Kick public key.") }));

  return server;
}
