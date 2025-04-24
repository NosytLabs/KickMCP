/**
 * Error codes specific to the Kick API
 */
export enum KickErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'invalid_credentials',
  EXPIRED_TOKEN = 'expired_token',
  INVALID_TOKEN = 'invalid_token',
  INSUFFICIENT_SCOPE = 'insufficient_scope',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_ALREADY_EXISTS = 'resource_already_exists',
  RESOURCE_FORBIDDEN = 'resource_forbidden',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  
  // Webhook errors
  WEBHOOK_INVALID_URL = 'webhook_invalid_url',
  WEBHOOK_INVALID_SIGNATURE = 'webhook_invalid_signature',
  WEBHOOK_INVALID_EVENT = 'webhook_invalid_event',
  
  // Stream errors
  STREAM_ALREADY_ACTIVE = 'stream_already_active',
  STREAM_NOT_ACTIVE = 'stream_not_active',
  
  // General errors
  BAD_REQUEST = 'bad_request',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  SERVICE_UNAVAILABLE = 'service_unavailable'
}