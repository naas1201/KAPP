# Cloudflare Deployment Guide

> **Complete guide for deploying KAPP Medical Booking Application to Cloudflare**

This guide covers deploying the application to Cloudflare Workers using the OpenNext adapter, with D1 database, R2 storage, and Workers AI.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Cloudflare Account](#step-1-create-cloudflare-account)
4. [Step 2: Create D1 Database](#step-2-create-d1-database)
5. [Step 3: Create R2 Bucket](#step-3-create-r2-bucket)
6. [Step 4: Configure wrangler.toml](#step-4-configure-wranglertoml)
7. [Step 5: Connect GitHub Repository](#step-5-connect-github-repository)
8. [Step 6: Set Environment Variables](#step-6-set-environment-variables)
9. [Step 7: Add Resource Bindings](#step-7-add-resource-bindings)
10. [Step 8: Deploy](#step-8-deploy)
11. [Step 9: Configure Firebase Auth](#step-9-configure-firebase-auth)
12. [Local Development](#local-development)
13. [Troubleshooting](#troubleshooting)
14. [Free Tier Limits](#free-tier-limits)

---

## Architecture Overview

### Service Architecture

| Service | Provider | Purpose |
|---------|----------|---------|
| **Hosting** | Cloudflare Workers | Next.js application (via OpenNext) |
| **Database** | Cloudflare D1 | Application data (SQLite-based) |
| **File Storage** | Cloudflare R2 | Documents, images (S3-compatible) |
| **Authentication** | Firebase Auth | User login (kept - 50k MAU free) |
| **AI Features** | Cloudflare Workers AI | FAQ generation, summaries |
| **Payments** | Stripe | Payment processing |

### Architecture Diagram

```
GitHub Repository
       │
       ▼ (auto-deploy on push)
┌──────────────────────────────────────────────┐
│           Cloudflare Workers                  │
│  ┌────────────────────────────────────────┐  │
│  │         Next.js Application            │  │
│  │    (built with OpenNext adapter)       │  │
│  └────────────────────────────────────────┘  │
│           │           │           │          │
│           ▼           ▼           ▼          │
│      ┌────────┐  ┌────────┐  ┌────────┐     │
│      │   D1   │  │   R2   │  │ Workers│     │
│      │  (DB)  │  │(Files) │  │   AI   │     │
│      └────────┘  └────────┘  └────────┘     │
└──────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   Firebase Auth            Stripe
   (Authentication)       (Payments)
```

---

## Prerequisites

Before starting, you need:

- ✅ GitHub account with access to this repository
- ✅ Free Cloudflare account ([cloudflare.com](https://cloudflare.com))
- ✅ Firebase project for authentication ([firebase.google.com](https://firebase.google.com))
- ✅ Stripe account for payments (optional) ([stripe.com](https://stripe.com))

---

## Step 1: Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Sign Up** if you don't have an account
3. Verify your email address
4. Complete the onboarding (you can skip adding a domain)

### Find Your Account ID

You'll need this for configuration:

1. Look at your dashboard URL: `https://dash.cloudflare.com/[ACCOUNT_ID]/...`
2. Or find it in the right sidebar of the dashboard
3. **Copy and save this ID** - you'll need it later

---

## Step 2: Create D1 Database

D1 is Cloudflare's serverless SQL database.

### 2.1 Create the Database

1. In Cloudflare Dashboard, click **Workers & Pages** in the left sidebar
2. Click **D1 SQL Database** tab
3. Click **Create** button
4. Enter database name: `kapp-db`
5. Click **Create**

### 2.2 Note the Database ID

1. Click on your `kapp-db` database
2. Copy the **Database ID** shown at the top
3. **Save this ID** - you'll need it for `wrangler.toml`

### 2.3 Create Database Tables

1. Click on your `kapp-db` database
2. Click the **Console** tab
3. Copy the entire contents of `migrations/schema.sql` from this repository
4. Paste it into the Console
5. Click **Execute**
6. Verify tables were created in the **Tables** tab

---

## Step 3: Create R2 Bucket

R2 is Cloudflare's object storage (S3-compatible).

### 3.1 Create the Bucket

1. In Cloudflare Dashboard, click **R2 Object Storage** in left sidebar
2. Click **Create bucket**
3. Enter bucket name: `kapp-files`
4. Select your preferred location (or leave as automatic)
5. Click **Create bucket**

---

## Step 4: Configure wrangler.toml

Update the `wrangler.toml` file in your repository with your D1 database ID:

```toml
# In wrangler.toml, find this line and replace with your database ID:
database_id = "YOUR_D1_DATABASE_ID_HERE"
```

**File location:** Root of repository (`/wrangler.toml`)

**Where to find D1 database ID:**
- Dashboard → Workers & Pages → D1 → Click your database → Copy "Database ID"

---

## Step 5: Connect GitHub Repository

### 5.1 Create Workers Project

1. In Cloudflare Dashboard, click **Workers & Pages**
2. Click **Create** button
3. Select **Pages** tab
4. Click **Connect to Git**

### 5.2 Authorize GitHub

1. Click **Connect GitHub**
2. Sign in to GitHub if prompted
3. Click **Authorize Cloudflare**
4. Select your GitHub account/organization
5. Choose **Only select repositories**
6. Select the **KAPP** repository
7. Click **Install & Authorize**

### 5.3 Configure Build Settings

| Setting | Value |
|---------|-------|
| **Project name** | `kapp-medical` (or your preferred name) |
| **Production branch** | `main` |
| **Framework preset** | None |
| **Build command** | `npm run pages:build` |
| **Build output directory** | `.open-next` |

> **⚠️ IMPORTANT**: Do NOT use `npm run build` or `pnpm run build` as the build command! 
> These commands only run the standard Next.js build and will NOT generate the `.open-next/worker.js` file required for Cloudflare Workers.
> 
> Use one of these commands instead:
> - `npm run pages:build` - Recommended (includes typecheck)
> - `npx @opennextjs/cloudflare build` - Alternative (OpenNext direct)

Click **Save and Deploy** (first deploy will fail - that's expected).

---

## Step 6: Set Environment Variables

After the project is created:

1. Go to your Pages project
2. Click **Settings** tab
3. Click **Environment variables** in left sidebar

### Required Variables

| Variable Name | Value | Encrypt? |
|--------------|-------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key | No |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | No |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID | No |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | No |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | No |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID | No |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | No |

### Stripe Variables (if using payments)

| Variable Name | Value | Encrypt? |
|--------------|-------|----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | No |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | **Yes** |

---

## Step 7: Add Resource Bindings

This connects your Worker to D1, R2, and AI.

### 7.1 Navigate to Bindings

1. In your Pages project, click **Settings**
2. Click **Functions** in the left sidebar
3. Scroll down to **Bindings**

### 7.2 Add D1 Database Binding

1. Click **Add binding**
2. Select **D1 database**
3. **Variable name**: `DB`
4. **D1 database**: Select `kapp-db`
5. Click **Save**

### 7.3 Add R2 Bucket Binding

1. Click **Add binding**
2. Select **R2 bucket**
3. **Variable name**: `STORAGE`
4. **R2 bucket**: Select `kapp-files`
5. Click **Save**

### 7.4 Add Workers AI Binding

1. Click **Add binding**
2. Select **Workers AI**
3. **Variable name**: `AI`
4. Click **Save**

---

## Step 8: Deploy

### Trigger Deployment

After configuring everything:

**Option 1: Retry previous deployment**
1. Go to **Deployments** tab
2. Click on the latest failed deployment
3. Click **Retry deployment**

**Option 2: Push to GitHub**
1. Make any small change (e.g., update README)
2. Push to your production branch
3. Cloudflare will automatically build and deploy

### Monitor Build

1. Click on the deployment to see build logs
2. Wait for the build to complete (2-5 minutes)
3. If successful, you'll see a green checkmark

### Access Your Site

Your site is available at: `https://[project-name].pages.dev`

---

## Step 9: Configure Firebase Auth

For Firebase Auth to work with your Cloudflare deployment:

1. Go to **Firebase Console** → Your project
2. Navigate to **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain**
4. Add your Cloudflare domain: `[project-name].pages.dev`
5. If using a custom domain, add that too

---

## Local Development

### With Firebase Emulators (Recommended)

```bash
# Terminal 1: Start Firebase emulators
./node_modules/.bin/firebase emulators:start --only firestore,auth --project demo-project

# Terminal 2: Start Next.js dev server
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
npm run dev
```

### With Wrangler (Cloudflare Local)

```bash
# Build for Cloudflare
npm run cf:build

# Run locally with wrangler
npm run cf:dev
```

### Key Commands

```bash
npm run dev          # Start Next.js development server (local dev)
npm run build        # Standard Next.js build (NOT for Cloudflare)
npm run pages:build  # Build for Cloudflare Pages (use this as Cloudflare build command)
npm run cf:build     # Same as pages:build - Build for Cloudflare Workers
npm run cf:dev       # Local development with wrangler
npm run cf:deploy    # Deploy to Cloudflare Workers (CLI)
npm run cf:preview   # Preview deployment locally
```

> **Note**: For Cloudflare Pages deployment, always use `npm run pages:build` or `npm run cf:build` as the build command, NOT `npm run build`.

---

## Troubleshooting

### Build Fails

**Error: "The entry-point file at .open-next/worker.js was not found"**
- **Cause**: The build command is not generating the OpenNext output
- **Solution**: Update your Cloudflare Pages build command to `npm run pages:build` or `npx @opennextjs/cloudflare build`
- **Do NOT use**: `npm run build`, `pnpm run build`, or just `next build` - these only run the standard Next.js build without generating the Cloudflare Worker files
- Go to Cloudflare Dashboard → Pages → Your project → Settings → Build & Deployment → Edit configurations → Change "Build command"

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally first

**Error: "Cannot find wrangler.toml"**
- Verify `wrangler.toml` exists in repo root
- Check the `database_id` is set correctly

### Database Errors

**Error: "D1 binding not found"**
- Check D1 binding is added in Settings → Functions → Bindings
- Verify binding name is exactly `DB`

### Authentication Issues

**Firebase auth not working**
- Verify all Firebase environment variables are set
- Add your Cloudflare domain to Firebase authorized domains
- Check browser console for specific error messages

### Environment Variable Issues

**Variables not working**
- Ensure variables are set for Production environment
- Rebuild after adding new variables
- Check for typos in variable names

---

## Free Tier Limits

| Resource | Free Limit | Notes |
|----------|------------|-------|
| **Workers Requests** | 100,000/day | ~3M/month |
| **D1 Reads** | 5M/day | Generous for most apps |
| **D1 Writes** | 100,000/day | Sufficient for booking apps |
| **D1 Storage** | 5 GB | Plenty for medical records |
| **R2 Storage** | 10 GB | Good for documents |
| **R2 Operations** | 10M reads/month | Generous |
| **Workers AI** | 10,000 neurons/day | ~100 AI requests |
| **Firebase Auth** | 50,000 MAU | Excellent free tier |

---

## Custom Domain (Optional)

### Add Custom Domain

1. In your Pages project, click **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter your domain: `app.yourdomain.com`
4. Click **Continue**

### Configure DNS

**If your domain is on Cloudflare:**
- Records are added automatically

**If your domain is elsewhere:**
1. Go to your domain registrar's DNS settings
2. Add a CNAME record:
   - **Name**: `app` (or your subdomain)
   - **Value**: `[project-name].pages.dev`
3. Wait for DNS propagation (up to 24 hours)

SSL is automatically provisioned by Cloudflare.

---

## Next Steps

After successful deployment:

1. ✅ Test authentication flow
2. ✅ Test booking flow
3. ✅ Test payment flow (if using Stripe)
4. ✅ Configure custom domain
5. ✅ Add Firebase authorized domains
6. ✅ Set up monitoring (Cloudflare Analytics)

---

## Files Reference

| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare Workers configuration |
| `open-next.config.ts` | OpenNext adapter configuration |
| `migrations/schema.sql` | D1 database schema |
| `src/cloudflare/` | Cloudflare-specific utilities |
| `env.example` | Environment variables template |
| `docs/CLOUDFLARE_BINDINGS_SETUP.md` | Detailed bindings setup guide |
| `latestcfdeploymentlog.md` | Deployment log analysis |

---

## Related Documentation

- **[Bindings Setup Guide](./CLOUDFLARE_BINDINGS_SETUP.md)** - Detailed guide for configuring all Worker bindings
- **[Deployment Log Analysis](../latestcfdeploymentlog.md)** - Analysis of recent deployment with fix instructions

---

## Support

- **Cloudflare Community**: [community.cloudflare.com](https://community.cloudflare.com)
- **OpenNext Documentation**: [opennext.js.org](https://opennext.js.org)
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)

---

**Last Updated**: December 2024
