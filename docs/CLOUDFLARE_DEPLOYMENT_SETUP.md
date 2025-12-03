# Cloudflare Deployment Setup Guide

This guide provides step-by-step instructions for deploying KAPP to Cloudflare **entirely online** through the Cloudflare Dashboard. No local CLI or command-line tools required.

> **Prerequisites**: 
> - A GitHub account with access to this repository
> - A free Cloudflare account (create at [cloudflare.com](https://cloudflare.com))
> - Firebase project already set up (for authentication)

## Table of Contents

1. [Overview](#overview)
2. [Step 1: Create Cloudflare Account](#step-1-create-cloudflare-account)
3. [Step 2: Create D1 Database](#step-2-create-d1-database)
4. [Step 3: Create R2 Bucket](#step-3-create-r2-bucket)
5. [Step 4: Connect GitHub Repository](#step-4-connect-github-repository)
6. [Step 5: Configure Build Settings](#step-5-configure-build-settings)
7. [Step 6: Set Environment Variables](#step-6-set-environment-variables)
8. [Step 7: Add Resource Bindings](#step-7-add-resource-bindings)
9. [Step 8: Deploy](#step-8-deploy)
10. [Step 9: Configure Custom Domain](#step-9-configure-custom-domain-optional)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### What Gets Deployed Where

| Service | Location | Purpose |
|---------|----------|---------|
| Next.js App | Cloudflare Workers | Main application |
| Database | Cloudflare D1 | App data (appointments, users, etc.) |
| File Storage | Cloudflare R2 | Documents, images |
| Authentication | Firebase Auth | User login (kept separate) |
| AI | Workers AI | FAQ generation |

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
│      │   D1   │  │   R2   │  │   AI   │     │
│      │  (DB)  │  │(Files) │  │        │     │
│      └────────┘  └────────┘  └────────┘     │
└──────────────────────────────────────────────┘
                    │
                    ▼
           Firebase Auth (external)
```

---

## Step 1: Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Sign Up** if you don't have an account
3. Verify your email address
4. Complete the onboarding (you can skip adding a domain for now)

### Find Your Account ID

You'll need this later:

1. After logging in, look at the URL: `https://dash.cloudflare.com/[ACCOUNT_ID]/...`
2. Copy the long alphanumeric string after `cloudflare.com/`
3. **Save this** - you'll need it for environment variables

---

## Step 2: Create D1 Database

D1 is Cloudflare's serverless SQL database.

### 2.1 Create the Database

1. In Cloudflare Dashboard, click **Workers & Pages** in the left sidebar
2. Click **D1 SQL Database** tab
3. Click **Create** button
4. Enter database name: `kapp-db`
5. Click **Create**

### 2.2 Create Database Tables

After creating the database:

1. Click on your `kapp-db` database
2. Click the **Console** tab
3. Copy and paste the following SQL schema (from `migrations/schema.sql` in this repo):

```sql
-- Users table (with Firebase Auth integration)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firebase_uid TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    email_lower TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('patient', 'doctor', 'admin')),
    name TEXT,
    staff_id TEXT,
    access_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
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

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date_time);

-- Files metadata (for R2 storage)
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

CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
```

4. Click **Execute** to run the SQL
5. Verify tables were created in the **Tables** tab

### 2.3 Note the Database ID

1. Go back to your D1 database list
2. Click on `kapp-db`
3. Copy the **Database ID** shown at the top
4. **Save this** - you'll need it for the `wrangler.toml` file

---

## Step 3: Create R2 Bucket

R2 is Cloudflare's object storage (like AWS S3).

### 3.1 Create the Bucket

1. In Cloudflare Dashboard, click **R2 Object Storage** in left sidebar
2. Click **Create bucket**
3. Enter bucket name: `kapp-files`
4. Select your preferred location (or leave as automatic)
5. Click **Create bucket**

### 3.2 Create API Token for R2 (Optional)

If you need programmatic access to R2:

1. In R2, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Give it a name: `KAPP R2 Access`
4. Permissions: **Object Read & Write**
5. Specify bucket: `kapp-files`
6. Click **Create API Token**
7. **Copy and save** the Access Key ID and Secret Access Key

> Note: If you only access R2 through Worker bindings, you don't need API tokens.

---

## Step 4: Connect GitHub Repository

### 4.1 Create Workers Project

1. In Cloudflare Dashboard, click **Workers & Pages**
2. Click **Create** button
3. Select **Pages** tab
4. Click **Connect to Git**

### 4.2 Authorize GitHub

1. Click **Connect GitHub**
2. Sign in to GitHub if prompted
3. Click **Authorize Cloudflare**
4. Select your GitHub account/organization
5. Choose **Only select repositories**
6. Select the **KAPP** repository
7. Click **Install & Authorize**

### 4.3 Select Repository

1. Back in Cloudflare, select the **KAPP** repository
2. Click **Begin setup**

---

## Step 5: Configure Build Settings

### 5.1 Basic Settings

| Setting | Value |
|---------|-------|
| **Project name** | `kapp-medical` (or your preferred name) |
| **Production branch** | `main` (or your production branch) |
| **Framework preset** | None |
| **Build command** | `npx @opennextjs/cloudflare build` |
| **Build output directory** | `.open-next` |
| **Root directory** | `/` (leave as default) |

### 5.2 Build Configuration

Under **Build customization** (if shown):

| Setting | Value |
|---------|-------|
| **Node.js version** | `20` (or latest LTS) |
| **Install command** | `npm install` (or `pnpm install` if using pnpm) |

Click **Save and Deploy** to create the project (first deploy will fail - that's expected).

---

## Step 6: Set Environment Variables

After the project is created:

1. Go to your Pages project
2. Click **Settings** tab
3. Click **Environment variables** in left sidebar

### 6.1 Add Production Variables

Click **Add variable** for each of these:

#### Firebase Configuration (Required)

| Variable Name | Value | Encrypt |
|--------------|-------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key | No |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | No |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID | No |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | No |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | No |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID | No |

#### Cloudflare Configuration

| Variable Name | Value | Encrypt |
|--------------|-------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID (from Step 1) | No |

#### Stripe Configuration (If using payments)

| Variable Name | Value | Encrypt |
|--------------|-------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | No |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | **Yes** |

#### R2 Configuration (If using API tokens)

| Variable Name | Value | Encrypt |
|--------------|-------|---------|
| `R2_ACCESS_KEY_ID` | Your R2 access key ID | **Yes** |
| `R2_SECRET_ACCESS_KEY` | Your R2 secret access key | **Yes** |

### 6.2 Click Save

After adding all variables, click **Save**.

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

### 7.4 Add Workers AI Binding (Optional)

1. Click **Add binding**
2. Select **Workers AI**
3. **Variable name**: `AI`
4. Click **Save**

---

## Step 8: Deploy

### 8.1 Trigger a New Deployment

After configuring everything:

1. Go to your Pages project **Deployments** tab
2. Click on the latest failed deployment
3. Click **Retry deployment**

Or trigger via Git:

1. Make any small change to the repository (e.g., update README)
2. Push to your production branch
3. Cloudflare will automatically build and deploy

### 8.2 Monitor Build

1. Click on the deployment to see build logs
2. Wait for the build to complete (usually 2-5 minutes)
3. If successful, you'll see a green checkmark

### 8.3 Access Your Site

After successful deployment:

1. Your site is available at: `https://[project-name].pages.dev`
2. Click the URL to open your deployed application

---

## Step 9: Configure Custom Domain (Optional)

### 9.1 Add Custom Domain

1. In your Pages project, click **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter your domain: `app.yourdomain.com`
4. Click **Continue**

### 9.2 Configure DNS

Cloudflare will show you DNS records to add:

**If your domain is on Cloudflare:**
- Records are added automatically

**If your domain is elsewhere:**
1. Go to your domain registrar's DNS settings
2. Add a CNAME record:
   - **Name**: `app` (or your subdomain)
   - **Value**: `[project-name].pages.dev`
3. Wait for DNS propagation (up to 24 hours)

### 9.3 Enable SSL

SSL is automatically provisioned by Cloudflare once DNS is verified.

---

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check that all dependencies are in `package.json`
- Ensure `@opennextjs/cloudflare` is installed

**Error: "Cannot find wrangler.toml"**
- Make sure `wrangler.toml` exists in repo root
- Verify the `database_id` is correct

### Database Errors

**Error: "D1 binding not found"**
- Check that the D1 binding is added in Settings → Functions → Bindings
- Verify binding name is exactly `DB`

### Environment Variable Issues

**Variables not working**
- Ensure variables are set for the correct environment (Production)
- Rebuild after adding new variables

### Authentication Issues

**Firebase auth not working**
- Verify all Firebase environment variables are set correctly
- Check Firebase Console → Authentication → Authorized domains
- Add your Cloudflare domain (`*.pages.dev` and custom domain)

---

## Infrastructure Files

The following files should exist in your repository:

### `wrangler.toml`

```toml
#:schema node_modules/wrangler/config-schema.json

name = "kapp-medical"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"
assets = { directory = ".open-next/assets", binding = "ASSETS" }

[[d1_databases]]
binding = "DB"
database_name = "kapp-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Get from Cloudflare D1 dashboard

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "kapp-files"

[ai]
binding = "AI"

[vars]
ENVIRONMENT = "production"
```

### `open-next.config.ts`

```typescript
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
  middleware: {
    external: true,
  },
};

export default config;
```

---

## Updating the Application

### Automatic Deployments

Every push to your production branch triggers a new deployment automatically.

### Manual Deployments

1. Go to **Deployments** tab
2. Click **Create deployment**
3. Select branch and click **Deploy**

### Rollback

If something goes wrong:

1. Go to **Deployments** tab
2. Find a previous successful deployment
3. Click the **...** menu
4. Select **Rollback to this deployment**

---

## Cost Estimation (Free Tier)

| Resource | Free Limit | Typical Usage |
|----------|------------|---------------|
| Workers Requests | 100,000/day | ~3M/month |
| D1 Reads | 5M/day | More than enough |
| D1 Writes | 100,000/day | Sufficient for most apps |
| D1 Storage | 5 GB | Plenty for medical booking |
| R2 Storage | 10 GB | Good for documents |
| R2 Operations | 10M reads/month | Generous |
| Workers AI | 10,000 neurons/day | ~100 AI requests |

---

## Next Steps

1. ✅ Verify deployment is working
2. ✅ Test authentication flow
3. ✅ Test booking flow
4. ✅ Configure custom domain
5. ✅ Set up monitoring (Cloudflare Analytics)
6. ✅ Add Firebase authorized domains

---

## Getting Help

- **Cloudflare Community**: [community.cloudflare.com](https://community.cloudflare.com)
- **OpenNext Discord**: [opennext.js.org](https://opennext.js.org)
- **Repository Issues**: Create an issue in this repo

---

**Document Version**: 1.0  
**Last Updated**: December 2024
