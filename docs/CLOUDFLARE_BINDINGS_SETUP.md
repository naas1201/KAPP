# Cloudflare Bindings Setup Guide

> **Complete guide to configure all required bindings for your KAPP Worker deployment**

This guide helps you fix deployment errors by properly configuring all required Cloudflare bindings from the **online Cloudflare Dashboard**. No CLI required!

---

## 📋 Quick Reference: Required Bindings Summary

| Binding Name | Type | Resource Name | Status | Notes |
|-------------|------|---------------|--------|-------|
| `DB` | D1 Database | `kapp-db` | ⚠️ Requires setup | Must create and get ID |
| `STORAGE` | R2 Bucket | `kapp-files` | ✅ Auto-provisioned | Usually auto-created |
| `AI` | Workers AI | - | ✅ Auto-enabled | No setup needed |
| `ASSETS` | Static Assets | - | ✅ Auto-configured | Handled by build |
| `ENVIRONMENT` | Env Variable | - | ✅ In wrangler.toml | Value: "production" |

---

## 🔴 Common Deployment Error Fix

If you see this error:
```
✘ [ERROR] binding DB of type d1 must have a valid `id` specified [code: 10021]
```

**Root Cause**: The `database_id` in `wrangler.toml` is set to a placeholder value.

**Solution**: Follow the steps below to get your D1 database ID and update the configuration.

---

## Step 1: Get Your D1 Database ID

### 1.1 Navigate to D1 Database

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** in the left sidebar
3. Click **D1 SQL Database** tab
4. You should see your `kapp-db` database (or create it if it doesn't exist)

### 1.2 Get the Database ID

1. Click on your database name (`kapp-db`)
2. Look at the top of the page for **Database ID**
3. **Copy this ID** - it looks like: `311f7365-7531-4451-bf8f-672c21c66f03`

### 1.3 Update wrangler.toml

In your repository, edit `wrangler.toml` and replace the placeholder:

```toml
[[d1_databases]]
binding = "DB"
database_name = "kapp-db"
# Replace this with your actual database ID:
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"
```

**Example with real ID:**
```toml
[[d1_databases]]
binding = "DB"
database_name = "kapp-db"
database_id = "311f7365-7531-4451-bf8f-672c21c66f03"
```

---

## Step 2: Create D1 Database (If Not Exists)

If you don't have a database yet:

### 2.1 Create the Database

1. In Cloudflare Dashboard → **Workers & Pages** → **D1 SQL Database**
2. Click **Create database**
3. Enter name: `kapp-db`
4. Click **Create**
5. Copy the **Database ID** shown

### 2.2 Initialize the Database Schema

**IMPORTANT**: After creating the database, you must run the schema to create all tables.

1. Click on your `kapp-db` database
2. Click the **Console** tab
3. Copy the entire contents of `migrations/schema.sql` from this repository
4. Paste it into the Console text area
5. Click **Execute**
6. Wait for execution to complete (may take 10-30 seconds)
7. Click the **Tables** tab to verify tables were created

**Tables you should see:**
- `users`
- `patients`
- `doctors`
- `appointments`
- `treatments`
- `doctor_services`
- `chat_rooms`
- `chat_messages`
- `chat_participants`
- `medical_info`
- `treatment_records`
- `prescriptions`
- `authorized_patients`
- `ratings`
- `files`
- `announcements`
- `faqs`
- `discount_codes`
- `feature_flags`
- `leads`
- `reports`
- `audit_logs`
- `pending_staff`
- `staff_credentials`

---

## Step 3: Verify R2 Bucket

The R2 bucket `kapp-files` is usually auto-provisioned during deployment.

### 3.1 Check if Bucket Exists

1. Go to Cloudflare Dashboard
2. Click **R2 Object Storage** in the left sidebar
3. Look for `kapp-files` bucket

### 3.2 Create Bucket (If Not Exists)

If the bucket doesn't exist:

1. Click **Create bucket**
2. Enter bucket name: `kapp-files`
3. Choose location (default is fine)
4. Click **Create bucket**

---

## Step 4: Set Environment Variables

### 4.1 Navigate to Settings

1. Go to **Workers & Pages**
2. Click on your worker (`kapp` or `kapp-medical`)
3. Click **Settings** tab
4. Click **Variables and Secrets** in the left sidebar

### 4.2 Required Environment Variables

Add these variables:

| Variable Name | Example Value | How to Find It | Encrypt? |
|--------------|---------------|----------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyB...` | Firebase Console → Project Settings → General → Your apps → Web app → apiKey | No |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `kapp-medical.firebaseapp.com` | Firebase Console → Same location → authDomain | No |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `kapp-medical` | Firebase Console → Project Settings → Project ID | No |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `kapp-medical.appspot.com` | Firebase Console → Same location → storageBucket | No |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | Firebase Console → Same location → messagingSenderId | No |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789012:web:abc123` | Firebase Console → Same location → appId | No |
| `CLOUDFLARE_ACCOUNT_ID` | `6ef54b6c3c948c59efd63fa96eab0bc8` | Cloudflare Dashboard URL or right sidebar | No |

### 4.3 Stripe Variables (For Payments)

| Variable Name | Example Value | How to Find It | Encrypt? |
|--------------|---------------|----------------|----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51...` or `pk_live_51...` | Stripe Dashboard → Developers → API keys → Publishable key | No |
| `STRIPE_SECRET_KEY` | `sk_test_51...` or `sk_live_51...` | Stripe Dashboard → Developers → API keys → Secret key | **Yes** |

### 4.4 How to Add Variables

1. Click **Add variable**
2. Enter the variable name (exactly as shown)
3. Enter the value
4. For sensitive values (like `STRIPE_SECRET_KEY`), click **Encrypt**
5. Click **Save**

---

## Step 5: Configure Bindings via Dashboard (Alternative Method)

If wrangler.toml configuration doesn't work, you can add bindings directly in the dashboard:

### 5.1 Navigate to Bindings

1. Go to your Worker → **Settings** → **Bindings**

### 5.2 Add D1 Database Binding

1. Click **Add binding** → **D1 database**
2. Variable name: `DB`
3. D1 database: Select `kapp-db`
4. Click **Save**

### 5.3 Add R2 Bucket Binding

1. Click **Add binding** → **R2 bucket**
2. Variable name: `STORAGE`
3. R2 bucket: Select `kapp-files`
4. Click **Save**

### 5.4 Add Workers AI Binding

1. Click **Add binding** → **Workers AI**
2. Variable name: `AI`
3. Click **Save**

---

## Step 6: Configure Firebase Auth Domain

For Firebase authentication to work:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Cloudflare URLs:
   - `kapp.pages.dev` (or your project name)
   - `kapp-medical.pages.dev` (if different)
   - Any custom domain you use

---

## Step 7: Redeploy

After making changes:

### Option 1: Push to GitHub
Any push to your main branch will trigger automatic deployment.

### Option 2: Retry Deployment
1. Go to **Workers & Pages** → Your project
2. Click **Deployments** tab
3. Find the latest failed deployment
4. Click **Retry deployment**

---

## 📍 Where to Find Your IDs

### Cloudflare Account ID
- **Location 1**: Look at your dashboard URL: `https://dash.cloudflare.com/[ACCOUNT_ID]/...`
- **Location 2**: Dashboard right sidebar under "Account ID"

### D1 Database ID
- **Location**: Workers & Pages → D1 → Click your database → "Database ID" at top

### Firebase Configuration
- **Location**: Firebase Console → Project Settings (gear icon) → General → Your apps → Web app config

### Stripe API Keys
- **Location**: Stripe Dashboard → Developers → API keys

---

## 🔍 Troubleshooting

### Error: "binding DB of type d1 must have a valid `id` specified"
- **Cause**: Invalid or placeholder database_id in wrangler.toml
- **Fix**: Get real database ID from D1 dashboard and update wrangler.toml

### Error: "D1 binding not found"
- **Cause**: D1 binding not configured
- **Fix**: Add binding in Settings → Bindings → Add D1 database

### Error: "R2 bucket not found"
- **Cause**: R2 bucket doesn't exist
- **Fix**: Create bucket in R2 Object Storage with name `kapp-files`

### Error: Worker name mismatch
- **Cause**: wrangler.toml has `name = "kapp-medical"` but CI expects `kapp`
- **Fix**: Either update wrangler.toml or rename worker in dashboard

### Firebase auth not working
- **Cause**: Domain not authorized
- **Fix**: Add Cloudflare domain to Firebase authorized domains

---

## 📊 Complete Configuration Checklist

Use this checklist to ensure everything is configured:

- [ ] **D1 Database**
  - [ ] Database `kapp-db` created
  - [ ] Database ID copied
  - [ ] wrangler.toml updated with real database_id
  - [ ] Schema executed in Console (migrations/schema.sql)
  - [ ] Tables visible in Tables tab

- [ ] **R2 Bucket**
  - [ ] Bucket `kapp-files` exists
  - [ ] Binding configured (usually auto-done)

- [ ] **Environment Variables**
  - [ ] NEXT_PUBLIC_FIREBASE_API_KEY
  - [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - [ ] NEXT_PUBLIC_FIREBASE_APP_ID
  - [ ] CLOUDFLARE_ACCOUNT_ID
  - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (if using Stripe)
  - [ ] STRIPE_SECRET_KEY (if using Stripe, encrypted)

- [ ] **Firebase**
  - [ ] Cloudflare domain added to authorized domains

- [ ] **Final Steps**
  - [ ] Changes committed and pushed
  - [ ] Deployment successful

---

## 📝 Sample wrangler.toml (Complete)

Here's what your complete wrangler.toml should look like:

```toml
#:schema node_modules/wrangler/config-schema.json

name = "kapp-medical"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# OpenNext output configuration
main = ".open-next/worker.js"
assets = { directory = ".open-next/assets", binding = "ASSETS" }

# D1 Database - REPLACE THE ID WITH YOUR ACTUAL DATABASE ID
[[d1_databases]]
binding = "DB"
database_name = "kapp-db"
database_id = "311f7365-7531-4451-bf8f-672c21c66f03"  # ← Your actual ID here

# R2 Bucket for file storage
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "kapp-files"

# Workers AI
[ai]
binding = "AI"

# Environment variables
[vars]
ENVIRONMENT = "production"

# Local development
[dev]
port = 8787
local_protocol = "http"
```

---

**Last Updated**: December 2024
