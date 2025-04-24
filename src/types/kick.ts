/**
 * Type definitions for Kick.com API responses
 */

export interface User {
  id: number;
  username: string;
  display_name: string;
  profile_image: string;
  bio?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  followed: boolean;
  subscriber_badges: Badge[];
  livestream?: Livestream;
  playback_url?: string;
  verified: boolean;
  muted: boolean;
  followers_count: number;
  followers_24h: number;
  subscriber_count: number;
  banner_image?: string;
  profile_image?: string;
  recent_categories: Category[];
  vod_enabled: boolean;
  subscription_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Livestream {
  id: number;
  channel_id: number;
  title: string;
  session_title: string;
  is_live: boolean;
  thumbnail?: string;
  viewers: number;
  categories: Category[];
  tags: Tag[];
  language: string;
  is_mature: boolean;
  duration: number;
  created_at: string;
  started_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  banner?: string;
  viewers_count: number;
  followed: boolean;
}

export interface Tag {
  id: number;
  name: string;
  tag_type: string;
}

export interface Badge {
  id: number;
  channel_id: number;
  months: number;
  image: string;
}

export interface Emote {
  id: number;
  channel_id: number;
  name: string;
  image: string;
  is_animated: boolean;
  is_global: boolean;
}

export interface Clip {
  id: number;
  slug: string;
  title: string;
  channel_id: number;
  category_id: number;
  user_id: number;
  views: number;
  thumbnail: string;
  duration: number;
  is_mature: boolean;
  created_at: string;
}

export interface AppAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface Video {
  id: number;
  channel_id: number;
  title: string;
  description: string;
  views: number;
  duration: number;
  thumbnail: string;
  is_public: boolean;
  is_mature: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: number;
  user_id: number;
  content: string;
  sent_at: string;
  user: User;
  badges: Badge[];
  emotes: Emote[];
}

export interface Subscription {
  id: number;
  channel_id: number;
  subscribed_at: string;
  expires_at: string;
  tier: number;
}

export interface Gift {
  id: number;
  sender_id: number;
  receiver_id: number;
  channel_id: number;
  gift_type: string;
  amount: number;
  message?: string;
  created_at: string;
}

export interface Poll {
  id: number;
  channel_id: number;
  title: string;
  options: PollOption[];
  duration: number;
  starts_at: string;
  ends_at: string;
  status: 'active' | 'completed' | 'canceled';
}

export interface PollOption {
  id: number;
  poll_id: number;
  option_text: string;
  votes: number;
}

export interface Prediction {
  id: number;
  channel_id: number;
  title: string;
  outcomes: PredictionOutcome[];
  duration: number;
  status: 'active' | 'resolved' | 'canceled';
  winning_outcome_id?: number;
  starts_at: string;
  ends_at: string;
}

export interface PredictionOutcome {
  id: number;
  prediction_id: number;
  title: string;
  color: string;
  total_points: number;
  users_count: number;
}

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}