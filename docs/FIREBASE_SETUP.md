# Firebase Setup Guide

This comprehensive guide covers all Firebase configuration for the KAPP Medical Booking Application, including Firestore Database, Authentication, and security rules.

## Table of Contents

1. [Firebase Project Setup](#firebase-project-setup)
2. [Firestore Database Configuration](#firestore-database-configuration)
3. [Security Rules](#security-rules)
4. [Firestore Indexes](#firestore-indexes)
5. [Firebase Authentication](#firebase-authentication)
6. [Collection Reference](#collection-reference)
7. [Environment Variables](#environment-variables)
8. [Troubleshooting](#troubleshooting)

---

## Firebase Project Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter your project name (e.g., "KAPP Medical")
4. Follow the prompts to complete project creation

### Step 2: Enable Required Services

In your Firebase project, enable the following services:

1. **Authentication** (for user login)
2. **Firestore Database** (for data storage)
3. **Storage** (optional, for file uploads)
4. **App Check** (optional, for security)

### Step 3: Get Firebase Configuration

1. Go to Firebase Console → Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click on the web app (or create one if not exists)
4. Copy the configuration values for your `.env.local` file

---

## Firestore Database Configuration

### Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose either:
   - **Production mode** (recommended for live apps)
   - **Test mode** (for development only - WARNING: allows all reads/writes for 30 days)
4. Select your preferred location (e.g., `asia-southeast1` for Philippines)
5. Click **"Enable"**

### Apply Security Rules

**⚠️ CRITICAL**: Security rules in your repository file (`firestore.rules`) are NOT automatically deployed. You must manually copy them.

1. In Firebase Console, go to **Firestore Database** → **Rules** tab
2. Delete the default rules
3. Copy the entire content from your repository's `firestore.rules` file
4. Paste it into the Firebase Console Rules editor
5. Click **"Publish"**

---

## Security Rules

The Firestore security rules use helper functions for role-based access control:

```javascript
function isSignedIn() {
  return request.auth != null;
}

function getUserRole(userId) {
  return get(/databases/$(database)/documents/users/$(userId)).data.role;
}

function isAdmin() {
  return isSignedIn() && getUserRole(request.auth.uid) == 'admin';
}

function isDoctor() {
  return isSignedIn() && getUserRole(request.auth.uid) == 'doctor';
}
```

### Key Security Points

- **Document IDs** for users/patients/doctors MUST match Firebase Auth UIDs
- Patients can only access their own data
- Doctors can only access authorized patients' data
- Admins have elevated access to all collections

### Deploy Rules via CLI

```bash
firebase deploy --only firestore:rules
```

---

## Firestore Indexes

Firestore requires indexes for certain queries. Create these manually or via CLI.

### Required Indexes

Navigate to Firebase Console → Firestore Database → **Indexes** tab and create:

#### Index 1: Appointments by Status (Collection Group)
| Field | Index Type |
|-------|------------|
| `status` | Ascending |

**Query scope:** Collection group

#### Index 2: Appointments by DateTime
| Field | Index Type |
|-------|------------|
| `dateTime` | Descending |

**Query scope:** Collection

#### Index 3: Ratings by Doctor
| Field | Index Type |
|-------|------------|
| `ratedId` | Ascending |
| `rating` | Ascending |

**Query scope:** Collection

#### Index 4: Chat Rooms by Participants
| Field | Index Type |
|-------|------------|
| `participants` | Array contains |
| `status` | Ascending |

**Query scope:** Collection

### Deploy Indexes via CLI

```bash
firebase deploy --only firestore:indexes
```

This uses the `firestore.indexes.json` file in your repository.

---

## Firebase Authentication

### Enable Email/Password Authentication

1. Go to Firebase Console → **Authentication** → **Sign-in method**
2. Click on **Email/Password**
3. Enable it and click **Save**

### Optional: Enable Other Providers

You can also enable:
- Google Sign-in
- Phone Authentication

---

## Collection Reference

### Core Collections

| Collection | Document ID | Purpose |
|------------|-------------|---------|
| `users` | Firebase Auth UID | Stores user roles (patient/doctor/admin) |
| `patients` | Firebase Auth UID | Stores patient profile data |
| `doctors` | Firebase Auth UID | Stores doctor profile data |
| `treatments` | Auto-generated | Master list of clinic treatments |
| `appointments` | Auto-generated | Top-level appointment records |
| `staffCredentials` | Auto-generated | Staff login verification |

### Patient Subcollections

| Path | Purpose |
|------|---------|
| `/patients/{patientId}/appointments/{appointmentId}` | Patient's appointment records |
| `/patients/{patientId}/treatmentRecords/{recordId}` | Medical consultation records |
| `/patients/{patientId}/prescriptions/{prescriptionId}` | Prescriptions |

### Doctor Subcollections

| Path | Purpose |
|------|---------|
| `/doctors/{doctorId}/services/{treatmentId}` | Doctor's service configurations |
| `/doctors/{doctorId}/customServices/{serviceId}` | Custom services |
| `/doctors/{doctorId}/patients/{patientId}` | Patient list with workflow status |
| `/doctors/{doctorId}/authorizedPatients/{patientId}` | Authorized patient access |

### Additional Collections

| Collection | Purpose |
|------------|---------|
| `chatRooms` | Doctor-patient messaging |
| `ratings` | Consultation ratings |
| `reports` | Patient reports |
| `discountCodes` | Coupon/discount codes |
| `announcements` | System announcements |
| `featureFlags` | Feature toggles |
| `auditLogs` | Admin action audit trail |

---

## Environment Variables

Create a `.env.local` file with Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: App Check Debug Token (for development)
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=your_debug_token
```

---

## Using Firebase Emulators

For local development without affecting production data:

### Start Emulators

```bash
./node_modules/.bin/firebase emulators:start --only firestore,auth --project demo-project
```

### Connect App to Emulators

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
pnpm dev
```

The emulator UI is available at `http://127.0.0.1:4000/`

### Seed Test Data

```bash
# Create staff accounts in emulator
export FIRESTORE_EMULATOR_HOST=localhost:8080
export AUTH_EMULATOR_HOST=localhost:9099
pnpm seed:prod-staff-accounts
```

---

## Troubleshooting

### "Permission denied" errors

**Cause:** Security rules not properly configured

**Solution:**
1. Go to Firebase Console → Firestore → Rules
2. Verify rules match `firestore.rules` in your repository
3. Click "Publish" after any changes

### "No staff profile found" at login

**Cause:** User document doesn't exist or has wrong ID

**Solution:**
1. Verify the user document exists in `users/{uid}` collection
2. Make sure the **Document ID** is the Auth UID (not email)
3. Check that the `role` field is exactly `admin` or `doctor`

### "Query requires an index" error

**Cause:** Missing Firestore index for the query

**Solution:**
1. Check browser console - Firebase provides a direct link to create the index
2. Click the link and create the index in Firebase Console
3. Wait ~5 minutes for index to build

### Appointments not showing

**Cause:** Data in wrong collection or security rules blocking

**Solution:**
1. Verify appointments exist in both:
   - `/patients/{patientId}/appointments/{appointmentId}`
   - `/appointments/{appointmentId}`
2. Check that the `status` field is set correctly
3. Ensure the user has the correct role in Firestore

### Emulator connection issues

**Solution:**
```bash
# Verify env vars are set
echo $FIRESTORE_EMULATOR_HOST  # Should be: localhost:8080
echo $FIREBASE_AUTH_EMULATOR_HOST  # Should be: localhost:9099

# Check emulator is running
curl http://localhost:8080  # Should respond
```

---

## Deployment Checklist

Before going live, verify:

- [ ] Security rules are copied from `firestore.rules` to Firebase Console
- [ ] All required indexes are created
- [ ] Authentication is enabled
- [ ] Environment variables are set in production
- [ ] At least one admin user exists
- [ ] `treatments` collection has service offerings
- [ ] Test a full booking flow end-to-end

---

## Support

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Console**: https://console.firebase.google.com/

---

**Last Updated**: December 2024
