# 📚 KAPP Documentation

Welcome to the KAPP Medical Booking Application documentation. This guide will help you understand, configure, and extend the application.

## 📖 Table of Contents

### Getting Started
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Complete guide for developers
- [Quick Start](#quick-start) - Get up and running in minutes

### Setup & Configuration
- [Firebase Setup](./FIREBASE_SETUP.md) - Firestore database and authentication configuration
- [Admin & Doctor Setup](./ADMIN_DOCTOR_SETUP.md) - Setting up staff accounts and roles
- [Stripe Payment Setup](./STRIPE_SETUP.md) - Payment integration guide
- [Storage Setup](./STORAGE_SETUP.md) - Firebase Storage configuration for file uploads

### Deployment
- [Cloudflare Deployment Plan](./CLOUDFLARE_DEPLOYMENT_PLAN.md) - Architecture and migration strategy
- [Cloudflare Deployment Setup](./CLOUDFLARE_DEPLOYMENT_SETUP.md) - **Step-by-step online setup guide**

### Features & Workflows
- [Doctor Workflows](./DOCTOR_WORKFLOWS.md) - Complete guide to doctor functionality
- [Application Blueprint](./blueprint.md) - Core features and design specifications

### Testing
- [E2E Testing Guide](./E2E_TESTING.md) - Playwright end-to-end testing

### Reference
- [API Reference](./API_REFERENCE.md) - Backend data schema and collections

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- Firebase project (or use local emulators)
- Stripe account (optional, for payments)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Stripe (required for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Firebase (optional - defaults are configured)
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Google AI (optional - for AI features)
# GOOGLE_API_KEY=...
```

### 3. Start Development Server

**Option A: With Firebase Emulators (Recommended)**

```bash
# Terminal 1: Start emulators
./node_modules/.bin/firebase emulators:start --only firestore,auth --project demo-project

# Terminal 2: Start app with emulator connection
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
pnpm dev
```

**Option B: Direct to Firebase**

```bash
pnpm dev
```

### 4. Access the Application

- **App**: http://localhost:9002
- **Firebase Emulator UI**: http://127.0.0.1:4000

---

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System administrators | Full access to all features |
| **Doctor** | Medical practitioners | Patient data, appointments, services |
| **Patient** | End users | Own data, bookings, messaging |

### Default Test Credentials

For development with emulators:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lpp.ovh | 1q2w3e4r5t6y |
| Doctor | doctor@lpp.ovh | 1q2w3e4r5t6y |

> ⚠️ **Security**: Change these credentials before production deployment!

---

## Key Commands

```bash
# Development
pnpm dev              # Start dev server (port 9002)
pnpm build            # Production build
pnpm start            # Start production server

# Quality
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript checking

# Testing
pnpm test             # Unit tests
pnpm test:rules       # Firestore rules tests
pnpm test:e2e         # E2E tests

# AI Development
pnpm genkit:dev       # GenKit AI development server

# Seeding
pnpm seed:prod-staff-accounts  # Create admin/doctor accounts
pnpm seed:firestore            # Seed initial database

# Cloudflare Deployment
pnpm cf:build         # Build for Cloudflare Workers
pnpm cf:dev           # Local development with wrangler
pnpm cf:deploy        # Deploy to Cloudflare Workers
pnpm cf:preview       # Preview deployment locally
```

---

## Architecture Overview

### Current Architecture (Firebase)

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 15 App                         │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   Admin     │   Doctor    │   Patient   │    Public        │
│  Dashboard  │  Dashboard  │   Portal    │   Booking        │
├─────────────┴─────────────┴─────────────┴──────────────────┤
│                    React Components                         │
│                 (Radix UI + Shadcn/UI)                      │
├────────────────────────────────────────────────────────────┤
│                    Firebase SDK                             │
│         ┌────────────┬────────────┬────────────┐           │
│         │    Auth    │  Firestore │  Storage   │           │
│         └────────────┴────────────┴────────────┘           │
├────────────────────────────────────────────────────────────┤
│               External Services                             │
│         ┌────────────┬────────────┐                        │
│         │   Stripe   │  GenKit AI │                        │
│         └────────────┴────────────┘                        │
└────────────────────────────────────────────────────────────┘
```

### Target Architecture (Cloudflare + Firebase Auth)

```
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Workers                         │
│                  (OpenNext Adapter)                         │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   Admin     │   Doctor    │   Patient   │    Public        │
│  Dashboard  │  Dashboard  │   Portal    │   Booking        │
├─────────────┴─────────────┴─────────────┴──────────────────┤
│                    React Components                         │
│                 (Radix UI + Shadcn/UI)                      │
├────────────────────────────────────────────────────────────┤
│  Firebase Auth  │  Cloudflare D1  │  Cloudflare R2        │
│    (kept)       │   (database)    │   (file storage)      │
├────────────────────────────────────────────────────────────┤
│               External Services                             │
│    ┌────────────┬────────────┬──────────────┐              │
│    │   Stripe   │ Workers AI │ Firebase Auth│              │
│    └────────────┴────────────┴──────────────┘              │
└────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
docs/
├── README.md                     # This file - Documentation index
├── DEVELOPMENT_GUIDE.md          # Developer guide
├── ADMIN_DOCTOR_SETUP.md         # Staff account setup
├── DOCTOR_WORKFLOWS.md           # Doctor functionality
├── FIREBASE_SETUP.md             # Firebase configuration
├── STRIPE_SETUP.md               # Payment setup
├── STORAGE_SETUP.md              # File upload setup
├── E2E_TESTING.md                # Testing guide
├── API_REFERENCE.md              # Data schema reference
├── blueprint.md                  # Application design specs
├── CLOUDFLARE_DEPLOYMENT_PLAN.md # Migration architecture
└── CLOUDFLARE_DEPLOYMENT_SETUP.md # Online setup guide
```

---

## Support

For issues or questions:

1. Check the relevant documentation section
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

**Last Updated**: December 2024
