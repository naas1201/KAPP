# Cloudflare Free Plan Deployment Guide

This document provides a comprehensive plan for deploying the KAPP Medical Booking Application on Cloudflare's free tier.

> **Important Note (December 2024)**: This plan keeps **Firebase Auth** as the authentication provider while migrating other services to Cloudflare. This is the recommended approach because:
> 1. Firebase Auth works well with any hosting provider
> 2. Cloudflare Access free tier only allows 50 users
> 3. Building custom auth is complex and error-prone for medical applications
> 4. Firebase Auth free tier has generous limits (50k monthly active users)

## Table of Contents

1. [Overview](#overview)
2. [What Changed: OpenNext Adapter](#what-changed-opennext-adapter)
3. [Cloudflare Free Tier Limits](#cloudflare-free-tier-limits)
4. [Service Mapping: Firebase → Cloudflare](#service-mapping-firebase--cloudflare)
5. [Phase 1: Project Setup](#phase-1-project-setup)
6. [Phase 2: Database Migration (Firestore → D1)](#phase-2-database-migration-firestore--d1)
7. [Phase 3: Keep Firebase Auth](#phase-3-keep-firebase-auth)
8. [Phase 4: File Storage (Firebase Storage → R2)](#phase-4-file-storage-firebase-storage--r2)
9. [Phase 5: AI Migration (Google AI → Workers AI)](#phase-5-ai-migration-google-ai--workers-ai)
10. [Phase 6: Deployment (Cloudflare Workers)](#phase-6-deployment-cloudflare-workers)
11. [Implementation Checklist](#implementation-checklist)
12. [Environment Variables](#environment-variables)
13. [Security Considerations](#security-considerations)
14. [Limitations & Workarounds](#limitations--workarounds)

---

## Overview

### Current Architecture (Firebase)
- **Authentication**: Firebase Auth (Email/Password, Google OAuth)
- **Database**: Firestore (NoSQL document database)
- **File Storage**: Firebase Storage
- **Hosting**: Firebase Hosting / App Hosting
- **AI**: Google GenKit with Gemini model

### Target Architecture (Cloudflare + Firebase Auth)
- **Authentication**: **Firebase Auth** (KEPT - free tier supports 50k MAU)
- **Database**: Cloudflare D1 (SQLite-based)
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Hosting**: Cloudflare Workers (via OpenNext adapter)
- **AI**: Cloudflare Workers AI

---

## What Changed: OpenNext Adapter

> ⚠️ **IMPORTANT**: The old `@cloudflare/next-on-pages` package is **DEPRECATED**.

As of late 2024, Cloudflare recommends using the **OpenNext adapter** (`@opennextjs/cloudflare`) for deploying Next.js applications. Key benefits:

1. **Unified Deployment**: Deploy to Cloudflare Workers directly (no separate Pages + Workers setup)
2. **Better Next.js Support**: Full support for App Router, Server Components, and edge runtime
3. **Active Development**: OpenNext is actively maintained and supports latest Next.js versions
4. **Simpler Configuration**: Uses standard `wrangler.toml` configuration

### Migration from `@cloudflare/next-on-pages`

If you were planning to use the old approach, update your dependencies:

```bash
# Remove old package (if installed)
pnpm remove @cloudflare/next-on-pages

# Install new OpenNext adapter
pnpm add -D @opennextjs/cloudflare wrangler
```

---

## Cloudflare Free Tier Limits

### Cloudflare Workers (Free)
- **Requests**: 100,000 requests/day
- **CPU time**: 10ms per request
- **Script size**: 1 MB (after compression)
- **Subrequests**: 50 per request

### Cloudflare D1 (Free)
- **Storage**: 5 GB total
- **Rows read**: 5 million/day
- **Rows written**: 100,000/day
- **Databases**: 10 maximum

### Cloudflare R2 (Free)
- **Storage**: 10 GB/month
- **Class A operations**: 1 million/month (PUT, POST, LIST)
- **Class B operations**: 10 million/month (GET)
- **Egress**: Free (no bandwidth charges!)

### Cloudflare Workers AI (Free)
- **Neurons**: 10,000/day
- **Models**: Various text, image, and code models available

### Firebase Auth (Free - KEPT)
- **Monthly Active Users**: 50,000 (generous free tier!)
- **Phone Auth**: 10k verifications/month
- **Social Logins**: Unlimited
- **Email/Password**: Unlimited

---

## Service Mapping: Firebase → Cloudflare

| Firebase Service | Target Service | Free Tier Limit | Notes |
|-----------------|----------------|-----------------|-------|
| **Firebase Auth** | **Firebase Auth (KEEP)** | 50k MAU | Best for medical apps |
| Firestore | D1 (SQLite) | 5 GB, 5M reads/day | Schema migration needed |
| Firebase Storage | R2 | 10 GB storage | S3-compatible |
| Firebase Hosting | Workers (OpenNext) | 100k req/day | Modern approach |
| Google GenKit/Gemini | Workers AI | 10k neurons/day | Different models |

---

## Phase 1: Project Setup

### Step 1.1: Install Dependencies

```bash
# Navigate to your project
cd KAPP

# Install OpenNext adapter and wrangler (dev dependencies)
pnpm add -D @opennextjs/cloudflare wrangler

# Install R2/S3 compatible library for storage
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Note: uuid, firebase, jose are already installed
```

### Step 1.2: Create Wrangler Configuration

Create `wrangler.toml` in project root:

```toml
#:schema node_modules/wrangler/config-schema.json

name = "kapp-medical"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"
assets = { directory = ".open-next/assets", binding = "ASSETS" }

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "kapp-db"
database_id = "" # Set after creating database in Cloudflare dashboard

# R2 Storage binding
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "kapp-files"

# Workers AI binding
[ai]
binding = "AI"

# Environment variables (non-sensitive)
[vars]
ENVIRONMENT = "production"

# Note: Sensitive variables (secrets) should be set via:
# - Cloudflare Dashboard > Workers > Settings > Variables
# - Or via: wrangler secret put SECRET_NAME
```

### Step 1.3: Create OpenNext Configuration

Create `open-next.config.ts` in project root:

```typescript
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      // Use ISR with D1 for caching (optional)
      // incrementalCache: "cloudflare-kv",
      // tagCache: "cloudflare-kv",
    },
  },
  
  // Configure middleware behavior
  middleware: {
    external: true,
  },
};

export default config;
```

### Step 1.4: Update package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "cf:build": "npx @opennextjs/cloudflare build",
    "cf:dev": "wrangler dev",
    "cf:deploy": "npx @opennextjs/cloudflare deploy",
    "cf:preview": "npx @opennextjs/cloudflare preview"
  }
}
```

### Step 1.5: Update .gitignore

Add to `.gitignore`:

```
# Cloudflare build output
.open-next/
.wrangler/
```

---

## Phase 2: Database Migration (Firestore → D1)

### Step 2.1: Create Database Schema

Create `migrations/schema.sql`:

```sql
-- Users table (replaces Firestore users collection)
-- Note: password_hash format is base64-encoded PBKDF2 hash
-- Format: base64(salt[16 bytes] + derived_key[32 bytes])
-- Expected length: ~64 characters
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    email_lower TEXT NOT NULL,
    password_hash TEXT NOT NULL,  -- Base64 encoded, ~64 chars
    role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('patient', 'doctor', 'admin')),
    name TEXT,
    staff_id TEXT,
    access_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_lower ON users(email_lower);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_staff_id ON users(staff_id);

-- Sessions table (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address TEXT
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);

-- Pending Staff (for staff invites before they sign up)
CREATE TABLE IF NOT EXISTS pending_staff (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('doctor', 'admin')),
    staff_id TEXT,
    access_code TEXT,
    invited_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

-- Staff Credentials (for staff login verification)
CREATE TABLE IF NOT EXISTS staff_credentials (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('doctor', 'admin')),
    uid TEXT REFERENCES users(id),
    staff_id TEXT,
    access_code TEXT,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY REFERENCES users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    emergency_contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY REFERENCES users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialization TEXT,
    license_number TEXT,
    phone TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Treatments table
CREATE TABLE IF NOT EXISTS treatments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    duration_minutes INTEGER,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Doctor Services (which treatments each doctor offers)
CREATE TABLE IF NOT EXISTS doctor_services (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    treatment_id TEXT NOT NULL REFERENCES treatments(id),
    custom_price DECIMAL(10,2),
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, treatment_id)
);

CREATE INDEX idx_doctor_services_doctor ON doctor_services(doctor_id);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT REFERENCES doctors(id),
    treatment_id TEXT REFERENCES treatments(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    date_time DATETIME NOT NULL,
    duration_minutes INTEGER,
    patient_notes TEXT,
    doctor_notes TEXT,
    price DECIMAL(10,2),
    payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(date_time);

-- Authorized Patients (doctor-patient relationships)
CREATE TABLE IF NOT EXISTS authorized_patients (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, patient_id)
);

CREATE INDEX idx_authorized_patients_doctor ON authorized_patients(doctor_id);
CREATE INDEX idx_authorized_patients_patient ON authorized_patients(patient_id);

-- Treatment Records
CREATE TABLE IF NOT EXISTS treatment_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    appointment_id TEXT REFERENCES appointments(id),
    diagnosis TEXT,
    treatment_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treatment_records_patient ON treatment_records(patient_id);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    treatment_record_id TEXT REFERENCES treatment_records(id),
    prescription_number TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    instructions TEXT,
    issued_date DATE NOT NULL,
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

-- Medical Info
CREATE TABLE IF NOT EXISTS medical_info (
    patient_id TEXT PRIMARY KEY REFERENCES patients(id),
    blood_type TEXT,
    allergies TEXT,
    current_medications TEXT,
    medical_conditions TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat Rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat Room Participants
CREATE TABLE IF NOT EXISTS chat_participants (
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    PRIMARY KEY (room_id, user_id)
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    appointment_id TEXT REFERENCES appointments(id),
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ratings_doctor ON ratings(doctor_id);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id),
    reported_user_id TEXT REFERENCES users(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads (contact form submissions)
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    source TEXT,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'converted', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'urgent')),
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATETIME,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Files (metadata for R2 storage)
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_user ON files(user_id);
CREATE INDEX idx_files_entity ON files(entity_type, entity_id);
```

### Step 2.2: Create D1 Database

```bash
# Login to Cloudflare
wrangler login

# Create the D1 database
wrangler d1 create kapp-production

# Note the database_id and update wrangler.toml

# Run migrations
wrangler d1 execute kapp-production --file=./migrations/schema.sql
```

### Step 2.3: Create Database Client

Create `src/cloudflare/db.ts`:

```typescript
import { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  AI: any;
  JWT_SECRET: string;
}

// Helper type for D1 results
export type D1Result<T> = {
  results: T[];
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
  };
};

// Type for Next.js request context in Cloudflare Pages
// This is added by @cloudflare/next-on-pages
export interface CloudflareRequestContext {
  env: Env;
  ctx: ExecutionContext;
}

// Helper to get typed context from request
export function getCloudflareContext(request: Request): CloudflareRequestContext {
  return (request as Request & { context: CloudflareRequestContext }).context;
}

// Get database from context (for API routes)
export function getDB(context: CloudflareRequestContext): D1Database {
  return context.env.DB;
}
```

---

## Phase 3: Keep Firebase Auth

> **Recommended Approach**: Keep Firebase Auth and don't migrate authentication to Cloudflare.

### Why Keep Firebase Auth?

1. **Free Tier is Generous**: Firebase Auth supports 50,000 monthly active users for free
2. **Security**: Firebase Auth is battle-tested for medical applications
3. **Social Logins**: Built-in Google, Facebook, Apple sign-in
4. **Phone Auth**: SMS verification included (10k/month free)
5. **Works Anywhere**: Firebase Auth works with any hosting provider
6. **No Custom Code**: No need to implement password hashing, session management, etc.

### What to Change

The existing Firebase Auth code (`src/firebase/client.ts`, `src/firebase/hooks.ts`) continues to work unchanged. Firebase Auth is a client-side SDK that communicates directly with Firebase servers.

### Firebase Auth with D1 Database

When using Firebase Auth with D1, you need to sync user data:

Create `src/cloudflare/auth/sync-user.ts`:

```typescript
/**
 * Sync Firebase Auth user to D1 database
 * Call this after successful Firebase Auth login/signup
 */
export async function syncUserToD1(
  db: D1Database,
  firebaseUser: { uid: string; email: string; displayName?: string },
  role: 'patient' | 'doctor' | 'admin' = 'patient'
) {
  const existingUser = await db
    .prepare('SELECT id FROM users WHERE firebase_uid = ?')
    .bind(firebaseUser.uid)
    .first();

  if (!existingUser) {
    // Create new user in D1
    await db
      .prepare(`
        INSERT INTO users (id, firebase_uid, email, email_lower, role, name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        firebaseUser.uid, // Use Firebase UID as D1 user ID for consistency
        firebaseUser.uid,
        firebaseUser.email,
        firebaseUser.email?.toLowerCase(),
        role,
        firebaseUser.displayName || ''
      )
      .run();
  }

  return { userId: firebaseUser.uid };
}
```

### Updated Schema for Firebase Auth

Update the D1 schema to support Firebase Auth UIDs:

```sql
-- Users table (with Firebase Auth integration)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,           -- Firebase UID
    firebase_uid TEXT UNIQUE,      -- Firebase UID (for explicit reference)
    email TEXT UNIQUE NOT NULL,
    email_lower TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('patient', 'doctor', 'admin')),
    name TEXT,
    staff_id TEXT,
    access_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Middleware for API Routes

Create `src/middleware.ts` to verify Firebase Auth tokens:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get Firebase ID token from Authorization header or cookie
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    // For API routes that require auth
    if (request.nextUrl.pathname.startsWith('/api/protected')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Token verification is handled by Firebase Admin SDK in API routes
  // or client-side by Firebase SDK
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/protected/:path*'],
};
```

---

## Phase 4: File Storage (Firebase Storage → R2)

### Step 4.1: Create R2 Bucket

```bash
# Create R2 bucket
wrangler r2 bucket create kapp-files

# Update wrangler.toml with the bucket binding (already included above)
```

### Step 4.2: Create Storage Utilities

Create `src/cloudflare/storage.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// R2 is S3-compatible
const getS3Client = () => {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
};

const BUCKET_NAME = 'kapp-files';

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  path: string;
}

export async function uploadFile(
  file: File,
  path: string
): Promise<UploadedFile> {
  const client = getS3Client();
  const fileId = uuidv4();
  const extension = file.name.split('.').pop() || '';
  const fileName = `${fileId}.${extension}`;
  const fullPath = `${path}/${fileName}`;
  
  const arrayBuffer = await file.arrayBuffer();
  
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullPath,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
      },
    })
  );
  
  // Generate presigned URL for access
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullPath,
    }),
    { expiresIn: 3600 } // 1 hour
  );
  
  return {
    id: fileId,
    name: file.name,
    url,
    type: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    path: fullPath,
  };
}

export async function uploadAppointmentFile(
  patientId: string,
  appointmentId: string,
  file: File
): Promise<UploadedFile> {
  return uploadFile(file, `patients/${patientId}/appointments/${appointmentId}`);
}

export async function uploadPatientDocument(
  patientId: string,
  file: File
): Promise<UploadedFile> {
  return uploadFile(file, `patients/${patientId}/documents`);
}

export async function deleteFile(path: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    })
  );
}

export async function getFileUrl(path: string): Promise<string> {
  const client = getS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    }),
    { expiresIn: 3600 }
  );
}

export async function listFiles(path: string): Promise<string[]> {
  const client = getS3Client();
  const result = await client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: path,
    })
  );
  
  const urls: string[] = [];
  for (const item of result.Contents || []) {
    if (item.Key) {
      const url = await getFileUrl(item.Key);
      urls.push(url);
    }
  }
  
  return urls;
}
```

---

## Phase 5: AI Migration (Google AI → Workers AI)

### Step 5.1: Create Workers AI Client

Create `src/cloudflare/ai.ts`:

```typescript
import { Ai } from '@cloudflare/ai';

export interface AIGenerateOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export async function generateText(
  ai: Ai,
  options: AIGenerateOptions
): Promise<string> {
  const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    prompt: options.prompt,
    max_tokens: options.maxTokens || 500,
    temperature: options.temperature || 0.7,
  });
  
  return response.response || '';
}

// FAQ Generation (replaces GenKit flow)
export async function generateTreatmentFAQ(
  ai: Ai,
  treatmentName: string,
  treatmentDescription: string
): Promise<{ question: string; answer: string }[]> {
  const prompt = `Generate 5 frequently asked questions and answers about the following medical treatment.
  
Treatment: ${treatmentName}
Description: ${treatmentDescription}

Format your response as a JSON array with objects containing "question" and "answer" fields.
Only output valid JSON, no additional text.`;

  const response = await generateText(ai, { prompt, maxTokens: 1000 });
  
  try {
    return JSON.parse(response);
  } catch {
    // Fallback if JSON parsing fails
    return [
      {
        question: `What is ${treatmentName}?`,
        answer: treatmentDescription,
      },
    ];
  }
}
```

### Step 5.2: Create AI API Route

Create `src/app/api/ai/generate-faq/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Ai } from '@cloudflare/ai';
import { generateTreatmentFAQ } from '@/cloudflare/ai';
import { getCloudflareContext } from '@/cloudflare/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const context = getCloudflareContext(request);
  
  try {
    const { treatmentName, treatmentDescription } = await request.json();
    
    if (!treatmentName || !treatmentDescription) {
      return NextResponse.json(
        { error: 'Treatment name and description are required' },
        { status: 400 }
      );
    }
    
    const faqs = await generateTreatmentFAQ(context.env.AI, treatmentName, treatmentDescription);
    
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('FAQ generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate FAQs' },
      { status: 500 }
    );
  }
}
```

---

## Phase 6: Deployment (Cloudflare Workers via OpenNext)

### Step 6.1: Build and Deploy with OpenNext

The OpenNext adapter handles the build and deployment process automatically:

```bash
# Build for Cloudflare Workers
pnpm run cf:build

# Preview locally before deploying
pnpm run cf:preview

# Deploy to Cloudflare Workers
pnpm run cf:deploy
```

### Step 6.2: Connect GitHub for Auto-Deployment

For automatic deployments from GitHub:

1. Go to **Cloudflare Dashboard** → **Workers & Pages**
2. Click **Create** → **Pages** → **Connect to Git**
3. Select your GitHub repository
4. Configure build settings:
   - **Framework preset**: None (we use custom build)
   - **Build command**: `npx @opennextjs/cloudflare build`
   - **Build output directory**: `.open-next/`
5. Click **Save and Deploy**

> See `docs/CLOUDFLARE_DEPLOYMENT_SETUP.md` for detailed step-by-step instructions.

### Step 6.3: Set Environment Variables

In Cloudflare Dashboard → Your Worker → **Settings** → **Variables and Secrets**:

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Plain text | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Plain text | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Plain text | Firebase project ID |
| `CLOUDFLARE_ACCOUNT_ID` | Plain text | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Secret | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | Secret | R2 API secret key |
| `STRIPE_SECRET_KEY` | Secret | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Plain text | Stripe publishable key |

### Step 6.4: Bind D1 and R2 to Worker

In Cloudflare Dashboard → Your Worker → **Settings** → **Bindings**:

1. **D1 Database**:
   - Click **Add binding**
   - Variable name: `DB`
   - D1 database: Select your `kapp-db` database

2. **R2 Bucket**:
   - Click **Add binding**
   - Variable name: `STORAGE`
   - R2 bucket: Select your `kapp-files` bucket

3. **Workers AI** (optional):
   - Click **Add binding**
   - Variable name: `AI`
   - Select Workers AI

### Step 6.5: Custom Domain (Optional)

1. Go to **Workers & Pages** → Your worker → **Settings** → **Domains & Routes**
2. Click **Add** → **Custom domain**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Follow the DNS setup instructions

---

## Implementation Checklist

### Phase 1: Project Setup
- [ ] Install OpenNext adapter and wrangler: `pnpm add -D @opennextjs/cloudflare wrangler`
- [ ] Create `wrangler.toml` configuration file
- [ ] Create `open-next.config.ts` file
- [ ] Update `package.json` scripts for Cloudflare builds
- [ ] Update `.gitignore` to exclude build outputs

### Phase 2: Database Migration
- [ ] Create `migrations/schema.sql` with D1 schema
- [ ] Create D1 database in Cloudflare dashboard
- [ ] Run schema migrations via dashboard or wrangler CLI
- [ ] Create `src/cloudflare/db.ts` database utilities
- [ ] Migrate existing Firestore data (if any)

### Phase 3: Authentication (Keep Firebase Auth)
- [ ] Keep existing Firebase Auth code unchanged
- [ ] Create `src/cloudflare/auth/sync-user.ts` for D1 sync
- [ ] Update D1 schema to include `firebase_uid` column
- [ ] Create middleware for API route protection

### Phase 4: File Storage
- [ ] Create R2 bucket in Cloudflare dashboard
- [ ] Create `src/cloudflare/storage.ts` utilities
- [ ] Update file upload components to use R2
- [ ] Migrate existing files from Firebase Storage (if any)

### Phase 5: AI Migration
- [ ] Create `src/cloudflare/ai.ts` Workers AI utilities
- [ ] Update or create new AI flows using Workers AI
- [ ] Keep GenKit for development, Workers AI for production (optional)

### Phase 6: Deployment
- [ ] Connect GitHub repository to Cloudflare
- [ ] Configure build settings in Cloudflare dashboard
- [ ] Set environment variables
- [ ] Add D1, R2, and AI bindings
- [ ] Test deployment
- [ ] Configure custom domain (optional)

### Final Verification
- [ ] Test authentication flow end-to-end
- [ ] Test database operations
- [ ] Test file uploads
- [ ] Test AI features
- [ ] Verify all routes work correctly

---

## Environment Variables

### Development (.env.local)

```env
# Firebase Auth (KEEP - same as before)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Cloudflare Account
CLOUDFLARE_ACCOUNT_ID=your-account-id

# R2 Storage
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Environment
NODE_ENV=development
```

### Production (Cloudflare Dashboard)

Set these in **Workers & Pages** → **Your Worker** → **Settings** → **Variables and Secrets**:

**Plain Text Variables:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Secrets (encrypted):**
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `STRIPE_SECRET_KEY`

---

## Security Considerations

### Firebase Auth Security (Kept)
- Firebase handles password hashing and storage securely
- JWT tokens are signed and verified by Firebase
- Social login providers handle OAuth securely
- Rate limiting and brute force protection built-in

### API Security
- Firebase ID tokens verified on API routes
- Role-based access control on sensitive endpoints
- Rate limiting via Cloudflare's built-in features
- CORS properly configured

### Data Security
- All connections are encrypted (HTTPS)
- R2 files accessed via signed URLs with expiration
- Sensitive data not exposed in client-side code
- D1 database encrypted at rest

### Cloudflare Security Features
- DDoS protection included
- Web Application Firewall (WAF) available
- Bot management
- SSL/TLS encryption automatic

---

## Limitations & Workarounds

### No Real-time Subscriptions
**Firebase Firestore offers real-time subscriptions. D1 does not.**

**Workarounds:**
1. **Polling**: Fetch data every 5-10 seconds
2. **Durable Objects**: Use Cloudflare Durable Objects for WebSocket connections (requires more setup)
3. **Server-Sent Events**: Implement SSE for one-way real-time updates

### AI Model Limitations
**Workers AI has different models than Google's Gemini.**

**Available models on free tier:**
- `@cf/meta/llama-3.1-8b-instruct` - General text generation (recommended)
- `@cf/mistral/mistral-7b-instruct-v0.2-lora` - Instruction-following
- `@cf/microsoft/phi-2` - Smaller, faster model

### OAuth with Firebase Auth (Works!)
**Since we keep Firebase Auth, Google OAuth works out of the box!**

Firebase Auth supports:
- Google Sign-in
- Facebook Sign-in
- Apple Sign-in
- GitHub Sign-in
- And more...

### Limited SQL Features
**D1 is SQLite-based with some limitations.**

**No support for:**
- Full-text search (use LIKE queries or FTS5 extension)
- Complex joins across many tables
- Some advanced SQL functions

### Build Limits
**Cloudflare free tier limits:**
- Workers: 100,000 requests/day
- Builds: 500/month (via GitHub integration)

**Tips:**
- Only trigger builds on main branches
- Use preview deployments wisely

---

## Support and Resources

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

---

## Related Documentation

- **[CLOUDFLARE_DEPLOYMENT_SETUP.md](./CLOUDFLARE_DEPLOYMENT_SETUP.md)** - Step-by-step online setup guide (no CLI required)
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebase configuration (for auth)
- **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Stripe payment integration

---

**Document Version**: 2.0  
**Last Updated**: December 2024  
**Changes**: Updated to use OpenNext adapter (deprecated @cloudflare/next-on-pages), kept Firebase Auth instead of custom auth
