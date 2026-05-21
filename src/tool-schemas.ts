import { z } from "zod";

const anyJson = z.unknown();
const anyObject = z.record(z.string(), anyJson);

export const getKickChannelInput = {
  slugs: z.array(z.string().min(1).max(25)).max(50).optional(),
  broadcasterUserIds: z.array(z.number().int().positive()).max(50).optional(),
};

export const getKickChannelOutput = {
  channels: z.array(
    z.object({
      broadcaster_user_id: z.number(),
      slug: z.string(),
      stream_title: z.string().optional(),
      channel_description: z.string().optional(),
      banner_picture: z.string().optional(),
      active_subscribers_count: z.number().optional(),
      category: z.object({ id: z.number().optional(), name: z.string().optional() }).optional(),
      stream: anyObject.optional(),
    }).passthrough(),
  ),
};

export const getKickLivestreamsInput = {
  broadcasterUserIds: z.array(z.number().int().positive()).max(50).optional(),
  categoryId: z.number().int().positive().optional(),
  language: z.string().min(2).max(16).optional(),
  limit: z.number().int().min(1).max(100).default(25).optional(),
  sort: z.enum(["viewer_count", "started_at"]).default("viewer_count").optional(),
};

export const getKickLivestreamsOutput = {
  livestreams: z.array(
    z.object({
      broadcaster_user_id: z.number(),
      slug: z.string(),
      stream_title: z.string().optional(),
      viewer_count: z.number().optional(),
      started_at: z.string().optional(),
      language: z.string().optional(),
      thumbnail: z.string().optional(),
      category: z.object({ id: z.number().optional(), name: z.string().optional() }).passthrough().optional(),
    }).passthrough(),
  ),
};

export const emptyInput = {};

export const genericDataOutput = {
  data: anyJson,
};

export const getKickUsersOutput = {
  users: z.array(anyObject),
};

export const getKickUsersInput = {
  ids: z.array(z.number().int().positive()).max(50).optional(),
};

export const getKickCategoriesInput = {
  names: z.array(z.string().min(3).max(100)).max(100).optional(),
  tags: z.array(z.string().min(3).max(100)).max(100).optional(),
  ids: z.array(z.number().int().positive()).max(100).optional(),
  cursor: z.string().min(4).max(28).optional(),
  limit: z.number().int().min(1).max(1000).default(25).optional(),
};

export const getKickLegacyCategoriesInput = {
  q: z.string().min(1).max(100),
  page: z.number().int().min(1).default(1).optional(),
};

export const getKickCategoryDetailInput = {
  category_id: z.number().int().positive(),
};

export const introspectKickTokenInput = {
  token_source: z.enum(["app", "user", "bot"]).default("app").optional(),
};

export const updateKickChannelInput = {
  stream_title: z.string().min(1).max(120).optional(),
  category_id: z.number().int().positive().optional(),
  custom_tags: z.array(z.string().min(1).max(32)).max(10).optional(),
};

export const rewardIdInput = {
  id: z.string().min(1),
};

export const createKickRewardInput = {
  title: z.string().min(1).max(50),
  cost: z.number().int().min(1),
  description: z.string().max(200).optional(),
  background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  is_enabled: z.boolean().optional(),
  is_user_input_required: z.boolean().optional(),
  should_redemptions_skip_request_queue: z.boolean().optional(),
};

export const updateKickRewardInput = {
  id: z.string().min(1),
  title: z.string().min(1).max(50).optional(),
  cost: z.number().int().min(1).optional(),
  description: z.string().max(200).optional(),
  background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  is_enabled: z.boolean().optional(),
  is_paused: z.boolean().optional(),
  is_user_input_required: z.boolean().optional(),
  should_redemptions_skip_request_queue: z.boolean().optional(),
};

export const getKickRedemptionsInput = {
  reward_id: z.string().min(1).optional(),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
  ids: z.array(z.string().min(1)).max(50).optional(),
  cursor: z.string().min(1).optional(),
};

export const resolveKickRedemptionsInput = {
  ids: z.array(z.string().min(1)).min(1).max(25),
};

export const listKickEventsInput = {
  broadcaster_user_id: z.number().int().positive().optional(),
};

export const createKickEventsInput = {
  broadcaster_user_id: z.number().int().positive().optional(),
  events: z.array(
    z.object({
      name: z.enum([
        "chat.message.sent",
        "channel.followed",
        "channel.subscription.renewal",
        "channel.subscription.gifts",
        "channel.subscription.new",
        "channel.reward.redemption.updated",
        "livestream.status.updated",
        "livestream.metadata.updated",
        "moderation.banned",
        "kicks.gifted",
      ]),
      version: z.number().int().positive().default(1),
    }),
  ).min(1).max(20),
};

export const deleteKickEventsInput = {
  ids: z.array(z.string().min(1)).min(1).max(50),
};

export const getKickKicksLeaderboardInput = {
  top: z.number().int().min(1).max(100).default(10).optional(),
};

export const getKickDropsClaimsInput = {
  campaign_id: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(1000).default(10).optional(),
  cursor: z.string().min(1).optional(),
  user_id: z.number().int().positive().optional(),
  claim_id: z.string().min(1).optional(),
};

export const verifyKickWebhookSignatureInput = {
  messageId: z.string().min(1),
  timestamp: z.string().min(1),
  body: z.string(),
  signature: z.string().min(1),
  publicKeyPem: z.string().min(1).optional(),
};

export const verifyKickWebhookSignatureOutput = {
  verified: z.boolean(),
};

export const moderateKickUserInput = {
  broadcaster_user_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  duration: z.number().int().min(1).max(10080).optional(),
  reason: z.string().max(100).optional(),
};

export const unmoderateKickUserInput = {
  broadcaster_user_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
};

export const sendKickChatInput = {
  type: z.enum(["user", "bot"]),
  content: z.string().min(1).max(500),
  broadcaster_user_id: z.number().int().positive().optional(),
  reply_to_message_id: z.string().uuid().optional(),
};

export const sendKickChatOutput = {
  is_sent: z.boolean(),
  message_id: z.string().optional(),
};

export const deleteKickChatInput = {
  message_id: z.string().min(1),
};

export const deleteKickChatOutput = {
  deleted: z.boolean(),
  message_id: z.string(),
};
