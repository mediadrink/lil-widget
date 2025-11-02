// Simple in-memory rate limiter
// For production scale, consider upgrading to Upstash Redis

interface RateLimitRecord {
  requests: number[];
  lastCleanup: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastGlobalCleanup = Date.now();

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastGlobalCleanup < CLEANUP_INTERVAL) return;

  const cutoff = now - (60 * 60 * 1000); // Remove entries older than 1 hour
  for (const [key, record] of rateLimitStore.entries()) {
    record.requests = record.requests.filter(timestamp => timestamp > cutoff);
    if (record.requests.length === 0) {
      rateLimitStore.delete(key);
    }
  }
  lastGlobalCleanup = now;
}

export interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (typically IP address)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupOldEntries();

  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create record
  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { requests: [], lastCleanup: now };
    rateLimitStore.set(identifier, record);
  }

  // Remove requests outside the current window
  record.requests = record.requests.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (record.requests.length >= config.maxRequests) {
    const oldestRequest = record.requests[0];
    const resetTime = oldestRequest + config.windowMs;

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Add current request
  record.requests.push(now);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.requests.length,
    reset: now + config.windowMs,
  };
}

/**
 * Get IP address from request headers
 */
export function getClientIp(request: Request): string {
  // Check common proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (may not be available in all environments)
  return 'unknown';
}

// Preset configurations for different endpoints
export const RATE_LIMITS = {
  // Widget chat - moderate limits (30 messages per 5 minutes per IP)
  WIDGET_CHAT: {
    maxRequests: 30,
    windowMs: 5 * 60 * 1000,
  },

  // Strict limits for high-cost operations (5 requests per minute)
  STRICT: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },

  // Generous limits for authenticated users (100 per 5 minutes)
  AUTHENTICATED: {
    maxRequests: 100,
    windowMs: 5 * 60 * 1000,
  },
};
