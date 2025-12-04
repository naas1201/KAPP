/**
 * Cloudflare Workers KV Utilities
 * 
 * This module provides utilities for working with Cloudflare Workers KV.
 * KV is a fast, eventually consistent key-value store.
 * 
 * Features:
 * - Session management
 * - Rate limiting
 * - Feature flags
 * - Response caching
 * 
 * Free tier limits:
 * - 100,000 reads/day
 * - 1,000 writes/day
 * - 1GB storage
 * 
 * @see https://developers.cloudflare.com/kv/
 */

import type { KVNamespace, CloudflareContext } from './types';
import { logger } from './logging';

/**
 * Get the KV namespace instance from the Cloudflare context
 */
export function getKV(context: CloudflareContext): KVNamespace {
  if (!context?.env?.KV) {
    throw new Error(
      'KV Namespace not available. Make sure you have configured the KV binding in wrangler.toml'
    );
  }
  return context.env.KV;
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Session data structure
 */
export interface Session {
  userId: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Session options
 */
export interface SessionOptions {
  /** TTL in seconds (default: 24 hours) */
  ttl?: number;
  /** Additional metadata to store */
  metadata?: Record<string, unknown>;
}

const SESSION_PREFIX = 'session:';
const DEFAULT_SESSION_TTL = 24 * 60 * 60; // 24 hours

/**
 * Create a new session
 */
export async function createSession(
  kv: KVNamespace,
  sessionId: string,
  userId: string,
  role: 'patient' | 'doctor' | 'admin',
  options: SessionOptions = {}
): Promise<Session> {
  const { ttl = DEFAULT_SESSION_TTL, metadata } = options;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 1000);
  
  const session: Session = {
    userId,
    role,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    metadata,
  };
  
  await kv.put(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: ttl }
  );
  
  logger.debug('Session created', { sessionId, userId, role });
  
  return session;
}

/**
 * Get a session by ID
 */
export async function getSession(
  kv: KVNamespace,
  sessionId: string
): Promise<Session | null> {
  const data = await kv.get(`${SESSION_PREFIX}${sessionId}`, 'json');
  return data as Session | null;
}

/**
 * Delete a session
 */
export async function deleteSession(
  kv: KVNamespace,
  sessionId: string
): Promise<void> {
  await kv.delete(`${SESSION_PREFIX}${sessionId}`);
  logger.debug('Session deleted', { sessionId });
}

/**
 * Extend session TTL
 */
export async function extendSession(
  kv: KVNamespace,
  sessionId: string,
  additionalTtl: number = DEFAULT_SESSION_TTL
): Promise<Session | null> {
  const session = await getSession(kv, sessionId);
  if (!session) return null;
  
  const newExpiresAt = new Date(Date.now() + additionalTtl * 1000);
  session.expiresAt = newExpiresAt.toISOString();
  
  await kv.put(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: additionalTtl }
  );
  
  return session;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Seconds until the rate limit resets */
  resetIn: number;
  /** Total limit */
  limit: number;
}

const RATE_LIMIT_PREFIX = 'ratelimit:';

/**
 * Check and update rate limit for an identifier
 * Uses a sliding window algorithm
 */
export async function checkRateLimit(
  kv: KVNamespace,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds } = config;
  const key = `${RATE_LIMIT_PREFIX}${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  
  // Get current rate limit data
  const data = await kv.get(key, 'json') as { 
    requests: number[]; 
  } | null;
  
  // Filter out old requests
  let requests = data?.requests || [];
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  const allowed = requests.length < maxRequests;
  
  if (allowed) {
    // Add new request timestamp
    requests.push(now);
    
    // Store updated data with TTL
    await kv.put(key, JSON.stringify({ requests }), {
      expirationTtl: windowSeconds,
    });
  }
  
  // Calculate reset time (when oldest request expires)
  const oldestRequest = requests[0] || now;
  const resetIn = Math.ceil((oldestRequest + (windowSeconds * 1000) - now) / 1000);
  
  return {
    allowed,
    remaining: Math.max(0, maxRequests - requests.length),
    resetIn: Math.max(0, resetIn),
    limit: maxRequests,
  };
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(
  kv: KVNamespace,
  identifier: string
): Promise<void> {
  await kv.delete(`${RATE_LIMIT_PREFIX}${identifier}`);
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetIn.toString(),
  };
}

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/**
 * Feature flag value
 */
export interface FeatureFlag {
  enabled: boolean;
  value?: unknown;
  description?: string;
  updatedAt: string;
}

const FEATURE_FLAG_PREFIX = 'feature:';

/**
 * Get a feature flag value
 */
export async function getFeatureFlag(
  kv: KVNamespace,
  flagName: string
): Promise<FeatureFlag | null> {
  const data = await kv.get(`${FEATURE_FLAG_PREFIX}${flagName}`, 'json');
  return data as FeatureFlag | null;
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(
  kv: KVNamespace,
  flagName: string,
  defaultValue = false
): Promise<boolean> {
  const flag = await getFeatureFlag(kv, flagName);
  return flag?.enabled ?? defaultValue;
}

/**
 * Set a feature flag
 */
export async function setFeatureFlag(
  kv: KVNamespace,
  flagName: string,
  enabled: boolean,
  value?: unknown,
  description?: string
): Promise<void> {
  const flag: FeatureFlag = {
    enabled,
    value,
    description,
    updatedAt: new Date().toISOString(),
  };
  
  await kv.put(
    `${FEATURE_FLAG_PREFIX}${flagName}`,
    JSON.stringify(flag)
  );
  
  logger.info('Feature flag updated', { flagName, enabled });
}

/**
 * List all feature flags
 */
export async function listFeatureFlags(
  kv: KVNamespace
): Promise<{ name: string; flag: FeatureFlag }[]> {
  const result = await kv.list({ prefix: FEATURE_FLAG_PREFIX });
  const flags: { name: string; flag: FeatureFlag }[] = [];
  
  for (const key of result.keys) {
    const flag = await kv.get(key.name, 'json') as FeatureFlag;
    if (flag) {
      flags.push({
        name: key.name.replace(FEATURE_FLAG_PREFIX, ''),
        flag,
      });
    }
  }
  
  return flags;
}

// =============================================================================
// RESPONSE CACHING
// =============================================================================

/**
 * Cached response data
 */
export interface CachedResponse<T = unknown> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

const CACHE_PREFIX = 'cache:';

/**
 * Cache a value with TTL
 */
export async function cacheSet<T>(
  kv: KVNamespace,
  key: string,
  value: T,
  ttlSeconds: number = 300 // 5 minutes default
): Promise<void> {
  const now = new Date();
  const cached: CachedResponse<T> = {
    data: value,
    cachedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
  };
  
  await kv.put(
    `${CACHE_PREFIX}${key}`,
    JSON.stringify(cached),
    { expirationTtl: ttlSeconds }
  );
}

/**
 * Get a cached value
 */
export async function cacheGet<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  const data = await kv.get(`${CACHE_PREFIX}${key}`, 'json');
  if (!data) return null;
  
  const cached = data as CachedResponse<T>;
  return cached.data;
}

/**
 * Delete a cached value
 */
export async function cacheDelete(
  kv: KVNamespace,
  key: string
): Promise<void> {
  await kv.delete(`${CACHE_PREFIX}${key}`);
}

/**
 * Get or set a cached value (cache-aside pattern)
 */
export async function cacheGetOrSet<T>(
  kv: KVNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(kv, key);
  if (cached !== null) {
    logger.debug('Cache hit', { key });
    return cached;
  }
  
  // Cache miss - fetch and store
  logger.debug('Cache miss', { key });
  const value = await fetchFn();
  await cacheSet(kv, key, value, ttlSeconds);
  
  return value;
}

// =============================================================================
// ANALYTICS TRACKING
// =============================================================================

/**
 * Simple analytics event
 */
export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}

const ANALYTICS_PREFIX = 'analytics:';
const ANALYTICS_BATCH_SIZE = 100;

/**
 * Track an analytics event
 * Note: Due to KV write limits, consider batching or using Analytics Engine for high-volume tracking
 */
export async function trackEvent(
  kv: KVNamespace,
  event: string,
  userId?: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const analyticsEvent: AnalyticsEvent = {
    event,
    userId,
    properties,
    timestamp: new Date().toISOString(),
  };
  
  // Use a time-based key for simple event storage
  const key = `${ANALYTICS_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  await kv.put(key, JSON.stringify(analyticsEvent), {
    expirationTtl: 7 * 24 * 60 * 60, // 7 days retention
  });
}

/**
 * Get recent analytics events
 */
export async function getRecentEvents(
  kv: KVNamespace,
  limit: number = 100
): Promise<AnalyticsEvent[]> {
  const result = await kv.list({ 
    prefix: ANALYTICS_PREFIX, 
    limit: Math.min(limit, ANALYTICS_BATCH_SIZE) 
  });
  
  const events: AnalyticsEvent[] = [];
  for (const key of result.keys) {
    const event = await kv.get(key.name, 'json') as AnalyticsEvent;
    if (event) {
      events.push(event);
    }
  }
  
  // Sort by timestamp descending
  return events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export const kv = {
  // Session management
  createSession,
  getSession,
  deleteSession,
  extendSession,
  
  // Rate limiting
  checkRateLimit,
  resetRateLimit,
  getRateLimitHeaders,
  
  // Feature flags
  getFeatureFlag,
  isFeatureEnabled,
  setFeatureFlag,
  listFeatureFlags,
  
  // Caching
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheGetOrSet,
  
  // Analytics
  trackEvent,
  getRecentEvents,
};

export default kv;
