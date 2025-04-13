export class KickApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KickApiError';
  }
}

export interface Channel {
  id: string;
  slug: string;
  name: string;
  // Add other channel properties
}

export interface Livestream {
  id: string;
  title: string;
  viewer_count: number;
  // Add other livestream properties
}

export interface User {
  id: string;
  username: string;
  // Add other user properties
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: User;
  // Add other chat message properties
}

export interface WebhookEvent {
  id: string;
  type: string;
  payload: any;
  // Add other webhook event properties
} 