import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { KickApiError } from '../utils/errors';

export class KickService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.KICK_API_BASE_URL || 'https://kick.com/api/v2';
    this.apiKey = process.env.KICK_API_KEY || '';
  }

  private async makeRequest<T>(method: string, endpoint: string, params?: any): Promise<T> {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: method !== 'GET' ? params : undefined,
        params: method === 'GET' ? params : undefined
      });

      return response.data as T;
    } catch (error) {
      logger.error('Kick API Error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        throw new KickApiError(
          axiosError.response?.data?.message || 'API request failed',
          axiosError.response?.status || 500
        );
      }
      throw new KickApiError('Unknown API error occurred', 500);
    }
  }

  // API Methods
  async getChannelInfo(channelId: string) {
    return this.makeRequest('GET', `/channels/${channelId}`);
  }

  async getLivestreams() {
    return this.makeRequest('GET', '/livestreams');
  }

  async getLivestreamBySlug(slug: string) {
    return this.makeRequest('GET', `/livestreams/${slug}`);
  }

  // Add other API methods here...
} 