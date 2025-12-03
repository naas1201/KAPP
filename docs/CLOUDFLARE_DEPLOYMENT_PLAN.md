# Cloudflare Free Plan Deployment Guide

This document provides a comprehensive plan for deploying the KAPP Medical Booking Application entirely on Cloudflare's free tier, replacing all Firebase and Google services.

## Table of Contents

1. [Overview](#overview)
2. [Cloudflare Free Tier Limits](#cloudflare-free-tier-limits)
3. [Service Mapping: Firebase → Cloudflare](#service-mapping-firebase--cloudflare)
4. [Branch Management Strategy](#branch-management-strategy)
5. [Phase 1: Project Setup](#phase-1-project-setup)
6. [Phase 2: Database Migration (Firestore → D1)](#phase-2-database-migration-firestore--d1)
7. [Phase 3: Authentication (Firebase Auth → Custom Auth with D1)](#phase-3-authentication-firebase-auth--custom-auth-with-d1)
8. [Phase 4: File Storage (Firebase Storage → R2)](#phase-4-file-storage-firebase-storage--r2)
9. [Phase 5: AI Migration (Google AI → Workers AI)](#phase-5-ai-migration-google-ai--workers-ai)
10. [Phase 6: Deployment (Firebase Hosting → Cloudflare Pages)](#phase-6-deployment-firebase-hosting--cloudflare-pages)
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

### Target Architecture (Cloudflare)
- **Authentication**: Custom auth with D1 database + JWT sessions
- **Database**: Cloudflare D1 (SQLite-based)
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Hosting**: Cloudflare Pages (with Next.js)
- **AI**: Cloudflare Workers AI

---

## Cloudflare Free Tier Limits

### Cloudflare Pages (Free)
- **Builds**: 500 builds/month
- **Bandwidth**: Unlimited
- **Sites**: Unlimited
- **Functions**: 100,000 requests/day

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

### Cloudflare Access (Important!)
- ⚠️ **Free tier**: Only 50 users for Zero Trust
- **For authentication**: We will NOT use Cloudflare Access
- **Solution**: Custom authentication stored in D1 database

---

## Service Mapping: Firebase → Cloudflare

| Firebase Service | Cloudflare Replacement | Free Tier Limit |
|-----------------|----------------------|-----------------|
| Firebase Auth | Custom Auth + D1 + JWT | Unlimited users |
| Firestore | D1 (SQLite) | 5 GB, 5M reads/day |
| Firebase Storage | R2 | 10 GB storage |
| Firebase Hosting | Cloudflare Pages | Unlimited bandwidth |
| Google GenKit/Gemini | Workers AI | 10k neurons/day |
| Firestore Rules | D1 + Middleware | N/A |
| Real-time Subscriptions | Polling / WebSockets | Via Durable Objects |

---

## Branch Management Strategy

### Creating the Cloudflare Branch

```bash
# From the main branch
git checkout main
git pull origin main

# Create a new branch for Cloudflare version
git checkout -b cloudflare

# Push the new branch to remote
git push -u origin cloudflare
```

### Branch Structure

```
main (Firebase version)
│
└── cloudflare (Cloudflare free tier version)
```

### Keeping Branches in Sync

When making changes that should apply to both versions:

```bash
# Make changes in main branch
git checkout main
git add .
git commit -m "feat: Add new feature"
git push origin main

# Cherry-pick to cloudflare branch (if applicable)
git checkout cloudflare
git cherry-pick <commit-hash>
git push origin cloudflare
```

### Merging Strategy

- Keep `main` as the Firebase production version
- Keep `cloudflare` as the Cloudflare production version
- Use feature branches for both: `feature/xyz-firebase` and `feature/xyz-cloudflare`

---

## Phase 1: Project Setup

### Step 1.1: Install Cloudflare Dependencies

```bash
# Navigate to your project
cd KAPP

# Install Cloudflare tools
pnpm add @cloudflare/next-on-pages wrangler

# Install authentication libraries
pnpm add bcryptjs jsonwebtoken
pnpm add -D @types/bcryptjs @types/jsonwebtoken

# Install R2/S3 compatible library
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 1.2: Create Wrangler Configuration

Create `wrangler.toml` in project root:

```toml
name = "kapp-medical"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "kapp-production"
database_id = "your-database-id-here"

# R2 Storage binding
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "kapp-files"

# Workers AI binding
[ai]
binding = "AI"

# Environment variables (secrets set via wrangler secret)
[vars]
ENVIRONMENT = "production"
```

### Step 1.3: Update Next.js Configuration

Update `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable edge runtime for Cloudflare Pages
  experimental: {
    runtime: 'edge',
  },
  // Disable image optimization (use Cloudflare Images instead)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### Step 1.4: Update package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:preview": "wrangler pages dev .vercel/output/static",
    "pages:deploy": "wrangler pages deploy .vercel/output/static",
    "db:migrate": "wrangler d1 execute kapp-production --file=./migrations/schema.sql",
    "db:seed": "wrangler d1 execute kapp-production --file=./migrations/seed.sql"
  }
}
```

---

## Phase 2: Database Migration (Firestore → D1)

### Step 2.1: Create Database Schema

Create `migrations/schema.sql`:

```sql
-- Users table (replaces Firestore users collection)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    email_lower TEXT NOT NULL,
    password_hash TEXT NOT NULL,
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

// Get database from context (for API routes)
export function getDB(context: { env: Env }): D1Database {
  return context.env.DB;
}
```

---

## Phase 3: Authentication (Firebase Auth → Custom Auth with D1)

Since Cloudflare Access only allows 50 users on the free tier, we'll implement custom authentication using D1 + JWT.

### Step 3.1: Create Auth Utilities

Create `src/cloudflare/auth/jwt.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export interface JWTPayload {
  sub: string;     // user id
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  exp?: number;
  iat?: number;
}

export async function createAccessToken(payload: Omit<JWTPayload, 'exp' | 'iat'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // Short-lived access token
    .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: Omit<JWTPayload, 'exp' | 'iat'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Long-lived refresh token
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}
```

Create `src/cloudflare/auth/password.ts`:

```typescript
// Using Web Crypto API for password hashing (Edge-compatible)
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derivedKey = await deriveKey(password, salt);
  
  // Combine salt and derived key
  const combined = new Uint8Array(SALT_LENGTH + KEY_LENGTH);
  combined.set(salt);
  combined.set(new Uint8Array(derivedKey), SALT_LENGTH);
  
  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const combined = new Uint8Array(
      atob(hash).split('').map(c => c.charCodeAt(0))
    );
    
    const salt = combined.slice(0, SALT_LENGTH);
    const storedKey = combined.slice(SALT_LENGTH);
    
    const derivedKey = await deriveKey(password, salt);
    const derivedKeyArray = new Uint8Array(derivedKey);
    
    // Constant-time comparison
    if (storedKey.length !== derivedKeyArray.length) return false;
    let result = 0;
    for (let i = 0; i < storedKey.length; i++) {
      result |= storedKey[i] ^ derivedKeyArray[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}
```

### Step 3.2: Create Auth API Routes

Create `src/app/api/auth/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/cloudflare/auth/password';
import { createAccessToken, createRefreshToken } from '@/cloudflare/auth/jwt';
import { getDB, Env } from '@/cloudflare/db';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const { env } = (request as any).context as { env: Env };
  const db = getDB({ env });
  
  try {
    const { email, password, fullName } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const emailLower = email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await db
      .prepare('SELECT id FROM users WHERE email_lower = ?')
      .bind(emailLower)
      .first();
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }
    
    // Check for pending staff invite
    const pendingStaff = await db
      .prepare('SELECT * FROM pending_staff WHERE email = ?')
      .bind(emailLower)
      .first();
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Generate user ID
    const userId = uuidv4();
    const role = pendingStaff?.role || 'patient';
    
    // Create user
    await db
      .prepare(`
        INSERT INTO users (id, email, email_lower, password_hash, role, name, staff_id, access_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        email,
        emailLower,
        passwordHash,
        role,
        fullName || '',
        pendingStaff?.staff_id || null,
        pendingStaff?.access_code || null
      )
      .run();
    
    // If staff invite exists, delete it and create staff credentials
    if (pendingStaff) {
      await db.prepare('DELETE FROM pending_staff WHERE email = ?').bind(emailLower).run();
    }
    
    // Create patient profile if role is patient
    if (role === 'patient') {
      const nameParts = (fullName || '').split(' ');
      await db
        .prepare(`
          INSERT INTO patients (id, first_name, last_name)
          VALUES (?, ?, ?)
        `)
        .bind(userId, nameParts[0] || '', nameParts.slice(1).join(' ') || '')
        .run();
    }
    
    // Create tokens
    const accessToken = await createAccessToken({ sub: userId, email: emailLower, role });
    const refreshToken = await createRefreshToken({ sub: userId, email: emailLower, role });
    
    // Store refresh token
    await db
      .prepare(`
        INSERT INTO sessions (id, user_id, refresh_token, expires_at)
        VALUES (?, ?, ?, datetime('now', '+7 days'))
      `)
      .bind(uuidv4(), userId, refreshToken)
      .run();
    
    // Determine redirect based on role
    let redirect = '/patient/dashboard';
    if (role === 'admin') redirect = '/admin';
    else if (role === 'doctor') redirect = '/doctor/dashboard';
    
    const response = NextResponse.json({
      user: { id: userId, email: emailLower, role, name: fullName },
      redirect,
    });
    
    // Set cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
    });
    
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/cloudflare/auth/password';
import { createAccessToken, createRefreshToken } from '@/cloudflare/auth/jwt';
import { getDB, Env } from '@/cloudflare/db';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const { env } = (request as any).context as { env: Env };
  const db = getDB({ env });
  
  try {
    const { email, password, rememberMe } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const emailLower = email.toLowerCase().trim();
    
    // Find user
    const user = await db
      .prepare('SELECT * FROM users WHERE email_lower = ?')
      .bind(emailLower)
      .first<{
        id: string;
        email: string;
        password_hash: string;
        role: string;
        name: string;
      }>();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create tokens
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as 'patient' | 'doctor' | 'admin',
    });
    
    const refreshToken = await createRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role as 'patient' | 'doctor' | 'admin',
    });
    
    // Store refresh token
    const expiresIn = rememberMe ? 30 : 7; // 30 days if remember me, else 7 days
    await db
      .prepare(`
        INSERT INTO sessions (id, user_id, refresh_token, expires_at)
        VALUES (?, ?, ?, datetime('now', '+${expiresIn} days'))
      `)
      .bind(uuidv4(), user.id, refreshToken)
      .run();
    
    // Determine redirect
    let redirect = '/patient/dashboard';
    if (user.role === 'admin') redirect = '/admin';
    else if (user.role === 'doctor') redirect = '/doctor/dashboard';
    
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      redirect,
    });
    
    // Set cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
    });
    
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresIn * 24 * 60 * 60,
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `src/app/api/auth/logout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDB, Env } from '@/cloudflare/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const { env } = (request as any).context as { env: Env };
  const db = getDB({ env });
  
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  if (refreshToken) {
    // Delete the session
    await db
      .prepare('DELETE FROM sessions WHERE refresh_token = ?')
      .bind(refreshToken)
      .run();
  }
  
  const response = NextResponse.json({ success: true });
  
  // Clear cookies
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  
  return response;
}
```

### Step 3.3: Create Auth Context and Hooks

Create `src/cloudflare/hooks.ts`:

```typescript
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ redirect: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ redirect: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err as Error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }
    
    const data = await response.json();
    setUser(data.user);
    return { redirect: data.redirect };
  };

  const signup = async (email: string, password: string, fullName: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Signup failed');
    }
    
    const data = await response.json();
    setUser(data.user);
    return { redirect: data.redirect };
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, signup, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUser() {
  const { user, isLoading, error } = useAuth();
  return { user, isLoading, error };
}
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

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const { env } = (request as any).context as { env: { AI: Ai } };
  
  try {
    const { treatmentName, treatmentDescription } = await request.json();
    
    if (!treatmentName || !treatmentDescription) {
      return NextResponse.json(
        { error: 'Treatment name and description are required' },
        { status: 400 }
      );
    }
    
    const faqs = await generateTreatmentFAQ(env.AI, treatmentName, treatmentDescription);
    
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

## Phase 6: Deployment (Firebase Hosting → Cloudflare Pages)

### Step 6.1: Configure Cloudflare Pages

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/`

### Step 6.2: Set Environment Variables

In Cloudflare Pages dashboard:

1. Go to Settings → Environment Variables
2. Add the following variables:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Random 32+ character string |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Step 6.3: Bind D1 and R2 to Pages

In Cloudflare Pages dashboard:

1. Go to Settings → Functions
2. Under "D1 database bindings", add:
   - Variable name: `DB`
   - D1 database: `kapp-production`
3. Under "R2 bucket bindings", add:
   - Variable name: `STORAGE`
   - R2 bucket: `kapp-files`
4. Under "AI bindings", add:
   - Variable name: `AI`

### Step 6.4: Deploy

```bash
# Build for Cloudflare Pages
pnpm run pages:build

# Deploy to Cloudflare Pages
pnpm run pages:deploy
```

Or use automatic deployments via GitHub integration.

---

## Implementation Checklist

### Branch Setup
- [ ] Create `cloudflare` branch from `main`
- [ ] Set up branch protection rules
- [ ] Configure CI/CD for both branches

### Phase 1: Project Setup
- [ ] Install Cloudflare dependencies
- [ ] Create `wrangler.toml`
- [ ] Update `next.config.ts` for edge runtime
- [ ] Update `package.json` scripts

### Phase 2: Database Migration
- [ ] Create D1 database schema
- [ ] Create D1 database in Cloudflare
- [ ] Run schema migrations
- [ ] Create database utility functions
- [ ] Migrate existing data (if any)

### Phase 3: Authentication
- [ ] Create JWT utilities
- [ ] Create password hashing utilities
- [ ] Create auth API routes (signup, login, logout, refresh)
- [ ] Create auth context and hooks
- [ ] Update login/signup pages to use new auth
- [ ] Remove Firebase Auth imports

### Phase 4: File Storage
- [ ] Create R2 bucket
- [ ] Create storage utilities
- [ ] Update file upload components
- [ ] Remove Firebase Storage imports

### Phase 5: AI Migration
- [ ] Create Workers AI utilities
- [ ] Update AI flows to use Workers AI
- [ ] Remove GenKit/Google AI imports

### Phase 6: Deployment
- [ ] Configure Cloudflare Pages project
- [ ] Set environment variables
- [ ] Bind D1 and R2 to Pages
- [ ] Test deployment
- [ ] Set up custom domain (optional)

### Final Steps
- [ ] Remove all Firebase dependencies from `package.json`
- [ ] Delete Firebase configuration files
- [ ] Update documentation
- [ ] Test all features end-to-end

---

## Environment Variables

### Development (.env.local)

```env
# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

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

Set these in Cloudflare Pages → Settings → Environment Variables:
- `JWT_SECRET`
- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Security Considerations

### Password Security
- Passwords are hashed using PBKDF2 with 100,000 iterations
- Salt is randomly generated for each password
- Hash comparison is done in constant time

### JWT Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7-30 days
- Tokens are stored in httpOnly cookies
- Tokens include user role for authorization

### API Security
- All API routes verify JWT before processing
- Role-based access control on sensitive endpoints
- Rate limiting via Cloudflare's built-in features
- CORS properly configured

### Data Security
- All connections are encrypted (HTTPS)
- R2 files accessed via signed URLs with expiration
- Sensitive data not exposed in client-side code

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
- `@cf/meta/llama-2-7b-chat-int8` - General text generation
- `@cf/microsoft/phi-2` - Smaller, faster model
- `@hf/thebloke/mistral-7b-instruct-v0.1-awq` - Instruction-following

### No Google OAuth
**Without Firebase, Google OAuth requires custom implementation.**

**Options:**
1. Use email/password only (recommended for simplicity)
2. Implement OAuth manually using Cloudflare Workers
3. Use a third-party auth provider (Auth0, Clerk) - may have costs

### Limited SQL Features
**D1 is SQLite-based with some limitations.**

**No support for:**
- Full-text search (use LIKE queries instead)
- Complex joins across many tables
- Some advanced SQL functions

### Build Time Limits
**Cloudflare Pages free tier has 500 builds/month.**

**Tips:**
- Only trigger builds on main/cloudflare branches
- Use caching effectively
- Avoid unnecessary commits

---

## Support and Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

**Document Version**: 1.0  
**Last Updated**: December 2024
