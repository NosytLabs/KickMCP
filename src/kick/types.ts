export type KickApiEnvelope<T> = {
  data?: T;
  message?: string;
  error?: string;
};

export type KickTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number | string;
  scope?: string;
};

export type KickCategory = {
  id?: number;
  name?: string;
  thumbnail?: string;
};

export type KickStream = {
  is_live?: boolean;
  is_mature?: boolean;
  language?: string;
  start_time?: string;
  thumbnail?: string;
  url?: string;
  viewer_count?: number;
};

export type KickChannel = {
  broadcaster_user_id: number;
  slug: string;
  stream_title?: string;
  channel_description?: string;
  banner_picture?: string;
  profile_picture?: string;
  active_subscribers_count?: number;
  canceled_subscribers_count?: number;
  category?: KickCategory;
  stream?: KickStream;
};

export type KickLivestream = {
  broadcaster_user_id: number;
  channel_id?: number;
  slug: string;
  stream_title?: string;
  viewer_count?: number;
  started_at?: string;
  language?: string;
  thumbnail?: string;
  profile_picture?: string;
  has_mature_content?: boolean;
  custom_tags?: string[];
  category?: KickCategory;
};

export type KickChatResponse = {
  is_sent: boolean;
  message_id?: string;
};

export type SendChatInput = {
  type: "user" | "bot";
  content: string;
  broadcaster_user_id?: number;
  reply_to_message_id?: string;
};

