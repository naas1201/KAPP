# Cloudflare Free Tier Optimization Guide

> **Maximize your KAPP Medical Booking Application with Cloudflare's Free Tier**

This guide covers all the free features available on Cloudflare and how to leverage them for the KAPP medical booking application.

## Table of Contents

1. [Free Tier Overview](#free-tier-overview)
2. [Workers (Compute)](#workers-compute)
3. [D1 Database](#d1-database)
4. [R2 Storage](#r2-storage)
5. [Workers KV](#workers-kv)
6. [Workers AI](#workers-ai)
7. [Observability & Logging](#observability--logging)
8. [Rate Limiting Implementation](#rate-limiting-implementation)
9. [Caching Strategy](#caching-strategy)
10. [Feature Flags](#feature-flags)
11. [Session Management](#session-management)
12. [Analytics Tracking](#analytics-tracking)
13. [Best Practices](#best-practices)
14. [Monitoring Dashboard](#monitoring-dashboard)

---

## Free Tier Overview

| Service | Free Tier Limit | KAPP Usage |
|---------|-----------------|------------|
| **Workers Requests** | 100,000/day | API calls, page renders |
| **Workers CPU Time** | 10ms/request | Request processing |
| **D1 Reads** | 5M/day | Database queries |
| **D1 Writes** | 100K/day | Appointments, users |
| **D1 Storage** | 5GB | Patient data, records |
| **R2 Storage** | 10GB | Medical documents, images |
| **R2 Class A Ops** | 10M/month | File uploads |
| **R2 Class B Ops** | 10M/month | File downloads |
| **KV Reads** | 100K/day | Cache, sessions, flags |
| **KV Writes** | 1K/day | Session updates |
| **KV Storage** | 1GB | Cache data |
| **Workers AI** | 10K neurons/day | ~100-500 AI requests |
| **Firebase Auth** | 50K MAU | User authentication |

---

## Workers (Compute)

### Limits
- 100,000 requests per day
- 10ms CPU time per request
- 128MB memory per worker

### Optimization Tips

1. **Minimize Cold Starts**: Keep your worker code small and avoid heavy initialization.

2. **Use Edge Caching**: Cloudflare automatically caches static assets.

3. **Efficient Response Handling**: Return responses as early as possible.

```typescript
// Good: Early return for cached responses
const cached = await kv.get('data');
if (cached) return new Response(cached);

// Process and cache
const data = await fetchData();
await kv.put('data', data, { expirationTtl: 300 });
return new Response(data);
```

---

## D1 Database

### Limits
- 5 million reads/day
- 100,000 writes/day
- 5GB storage

### Optimization Tips

1. **Batch Operations**: Combine multiple queries into batches.

```typescript
import { batch } from '@/cloudflare';

// Good: Single batch operation
const results = await batch(db, [
  { sql: 'SELECT * FROM users WHERE id = ?', params: [userId] },
  { sql: 'SELECT * FROM appointments WHERE patient_id = ?', params: [patientId] },
]);

// Bad: Multiple separate queries
const user = await query(db, 'SELECT * FROM users WHERE id = ?', [userId]);
const appointments = await query(db, 'SELECT * FROM appointments WHERE patient_id = ?', [patientId]);
```

2. **Use Indexes**: The schema includes indexes on frequently queried columns.

3. **Limit Result Sets**: Always use LIMIT in queries.

```typescript
// Good: Limited query
const appointments = await query(db, 
  'SELECT * FROM appointments WHERE doctor_id = ? ORDER BY date_time DESC LIMIT 50',
  [doctorId]
);
```

---

## R2 Storage

### Limits
- 10GB storage (no egress fees!)
- 10M Class A operations/month (PUT, POST, LIST)
- 10M Class B operations/month (GET, HEAD)

### Optimization Tips

1. **Organize Files**: Use path prefixes for efficient listing.

```typescript
// File structure
patients/{patientId}/documents/
patients/{patientId}/photos/
patients/{patientId}/appointments/{appointmentId}/
```

2. **Set Cache Headers**: Reduce repeated downloads.

```typescript
await bucket.put(path, file, {
  httpMetadata: {
    cacheControl: 'public, max-age=86400', // 24 hours
  },
});
```

3. **Compress Before Upload**: Reduce storage usage.

---

## Workers KV

### Limits
- 100,000 reads/day
- 1,000 writes/day
- 1GB storage

### Usage in KAPP

KV is configured for:
- **Session Management**: User sessions with TTL
- **Rate Limiting**: API protection
- **Feature Flags**: Dynamic feature toggles
- **Response Caching**: Frequently accessed data

### Setup

1. Create KV namespace in Cloudflare Dashboard:
   - Go to Workers & Pages → KV
   - Click "Create namespace"
   - Name it: `kapp-cache`
   - Copy the namespace ID

2. Update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"
```

---

## Workers AI

### Limits
- 10,000 neurons/day
- Approximately 100-500 requests depending on model

### Available Models (Free)

| Model | Best For | Neurons/Request |
|-------|----------|-----------------|
| `llama-3.1-8b-instruct` | General, FAQs | ~100 |
| `llama-3.2-3b-instruct` | Quick responses | ~30 |
| `mistral-7b-instruct` | Detailed text | ~70 |

### Usage Examples

```typescript
import { generateTreatmentFAQ, generateHealthTips } from '@/cloudflare';

// Generate FAQs for a treatment
const faqs = await generateTreatmentFAQ(ai, 'Dental Cleaning', 'Regular cleaning...', 5);

// Generate health tips
const tips = await generateHealthTips(ai, { age: 45, conditions: ['diabetes'] });
```

---

## Observability & Logging

### Available on Free Tier

1. **Real-time Logs**: View logs via Dashboard
   - Workers & Pages → Your Worker → Logs → Start stream

2. **Worker Analytics**: Basic metrics in dashboard
   - Requests, errors, CPU time

3. **Structured Logging**: Use our logging module

```typescript
import { logger, logOperation } from '@/cloudflare';

// Initialize from environment
logger.initFromEnv(context);

// Structured logging
logger.info('Appointment created', { 
  appointmentId, 
  patientId, 
  doctorId 
});

// Log with timing
const result = await logOperation('fetch-patient-data', async () => {
  return await getPatientData(patientId);
});
```

### Log Levels

| Level | When to Use |
|-------|-------------|
| `debug` | Development debugging |
| `info` | Normal operations |
| `warn` | Recoverable issues |
| `error` | Critical failures |

### Viewing Logs

1. **Dashboard (Real-time)**:
   - Workers & Pages → Your Worker → Logs
   - Click "Start log stream"
   - Logs are retained for 72 hours

2. **Wrangler CLI (Development)**:
   ```bash
   npx wrangler tail
   ```

---

## Rate Limiting Implementation

### How It Works

Uses KV to track request counts per identifier (IP or user ID).

```typescript
import { checkRateLimit, getRateLimitHeaders } from '@/cloudflare';

// Check rate limit
const result = await checkRateLimit(kv, clientIp, {
  maxRequests: 60,
  windowSeconds: 60,
});

if (!result.allowed) {
  return new Response('Too Many Requests', {
    status: 429,
    headers: getRateLimitHeaders(result),
  });
}
```

### Configuration

Set via environment variables in `wrangler.toml`:

```toml
[vars]
RATE_LIMIT_REQUESTS = "60"
RATE_LIMIT_WINDOW_SECONDS = "60"
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| API General | 60/min | 60s |
| Login | 5/min | 60s |
| Booking | 10/min | 60s |

---

## Caching Strategy

### What to Cache

1. **Treatment List**: Cache for 5 minutes
2. **Doctor Availability**: Cache for 1 minute
3. **FAQ Content**: Cache for 1 hour
4. **Static Content**: Cache indefinitely

### Implementation

```typescript
import { cacheGetOrSet } from '@/cloudflare';

// Cache-aside pattern
const treatments = await cacheGetOrSet(
  kv,
  'treatments:active',
  async () => await getActiveTreatments(db),
  300 // 5 minutes
);
```

### Cache Invalidation

```typescript
import { cacheDelete } from '@/cloudflare';

// Invalidate when data changes
await cacheDelete(kv, 'treatments:active');
```

---

## Feature Flags

### Managing Features

```typescript
import { setFeatureFlag, isFeatureEnabled } from '@/cloudflare';

// Set a feature flag
await setFeatureFlag(kv, 'ai_faq_generation', true, null, 'Enable AI FAQ generation');

// Check if enabled
if (await isFeatureEnabled(kv, 'ai_faq_generation')) {
  // Use AI
}
```

### Recommended Flags

| Flag | Description | Default |
|------|-------------|---------|
| `ai_faq_generation` | Enable AI-powered FAQs | true |
| `guest_booking` | Allow booking without account | true |
| `online_payments` | Enable Stripe payments | true |
| `video_consultations` | Enable video calls | false |

---

## Session Management

### Creating Sessions

```typescript
import { createSession, getSession, deleteSession } from '@/cloudflare';

// Create session after login
const session = await createSession(kv, sessionId, userId, 'patient', {
  ttl: 24 * 60 * 60, // 24 hours
});

// Verify session
const session = await getSession(kv, sessionId);
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}

// Logout
await deleteSession(kv, sessionId);
```

---

## Analytics Tracking

### Basic Event Tracking

```typescript
import { trackEvent, getRecentEvents } from '@/cloudflare';

// Track an event
await trackEvent(kv, 'appointment_booked', userId, {
  treatmentId,
  doctorId,
  amount: 150,
});

// Get recent events (admin)
const events = await getRecentEvents(kv, 100);
```

### Limitations

- KV write limit: 1,000/day
- For high-volume tracking, consider:
  - Batching events
  - Using external analytics (GA4)
  - Upgrading to paid plan with Analytics Engine

---

## Best Practices

### 1. Minimize KV Writes

```typescript
// Bad: Multiple writes
await kv.put('user:1:name', 'John');
await kv.put('user:1:email', 'john@example.com');

// Good: Single write
await kv.put('user:1', JSON.stringify({ name: 'John', email: 'john@example.com' }));
```

### 2. Use waitUntil for Background Tasks

```typescript
// Don't block response for logging
ctx.waitUntil(trackEvent(kv, 'page_view', userId));
return new Response('OK');
```

### 3. Implement Graceful Degradation

```typescript
// Continue if cache fails
let treatments;
try {
  treatments = await cacheGet(kv, 'treatments');
} catch (e) {
  logger.warn('Cache unavailable', { error: e });
}

if (!treatments) {
  treatments = await getActiveTreatments(db);
}
```

### 4. Monitor Usage

Check your usage regularly:
- Dashboard → Overview → Usage

Set up alerts when approaching limits.

---

## Monitoring Dashboard

### Key Metrics to Watch

| Metric | Location | Alert Threshold |
|--------|----------|-----------------|
| Worker Requests | Dashboard → Overview | 80K/day |
| D1 Reads | Dashboard → D1 | 4M/day |
| D1 Writes | Dashboard → D1 | 80K/day |
| KV Reads | Dashboard → KV | 80K/day |
| KV Writes | Dashboard → KV | 800/day |
| Error Rate | Dashboard → Analytics | > 1% |

### Setting Up Monitoring

1. **Email Alerts**: Configure in Dashboard → Notifications
2. **External Monitoring**: Consider uptime monitors like:
   - Better Uptime (free tier)
   - UptimeRobot (free tier)

---

## Upgrading When Needed

When you outgrow free tier:

### Workers Paid ($5/month)
- Unlimited requests
- 30s CPU time
- Durable Objects
- Queues
- Analytics Engine

### D1 Paid ($0.75/GB stored)
- Unlimited reads
- $1/million writes

### R2 Paid
- $0.015/GB stored
- $4.50/million Class A ops
- $0.36/million Class B ops

---

## Related Documentation

- [Cloudflare Deployment Guide](./CLOUDFLARE_DEPLOYMENT.md)
- [Bindings Setup Guide](./CLOUDFLARE_BINDINGS_SETUP.md)
- [Video & Chat Implementation Guide](./CLOUDFLARE_VIDEO_CHAT_GUIDE.md)

---

**Last Updated**: December 2024
