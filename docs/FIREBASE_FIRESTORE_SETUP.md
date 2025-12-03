# Firebase & Firestore Manual Setup Guide

This guide provides step-by-step instructions for manually setting up Firebase and Firestore for the KAPP Medical Booking Application.

## Table of Contents
1. [Firebase Console Setup](#firebase-console-setup)
2. [Firestore Database Setup](#firestore-database-setup)
3. [Security Rules Configuration](#security-rules-configuration)
4. [Firestore Indexes](#firestore-indexes)
5. [Required Collections](#required-collections)
6. [Firebase Authentication Setup](#firebase-authentication-setup)
7. [Environment Variables](#environment-variables)
8. [Troubleshooting](#troubleshooting)

---

## Firebase Console Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter your project name (e.g., "KAPP Medical")
4. Follow the prompts to complete project creation

### Step 2: Enable Required Services

In your Firebase project, enable the following services:

1. **Authentication** (for user login)
2. **Firestore Database** (for data storage)
3. **App Check** (optional, for security)

---

## Firestore Database Setup

### Step 1: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose either:
   - **Production mode** (recommended for live apps)
   - **Test mode** (for development only - WARNING: allows all reads/writes for 30 days)
4. Select your preferred location (e.g., `asia-southeast1` for Philippines)
5. Click **"Enable"**

### Step 2: Copy Security Rules

**CRITICAL: The Firestore rules in your repository file (`firestore.rules`) are NOT automatically deployed to Firebase. You must manually copy them.**

1. In Firebase Console, go to **Firestore Database** → **Rules** tab
2. Delete the default rules
3. Copy the entire content from your repository's `firestore.rules` file
4. Paste it into the Firebase Console Rules editor
5. Click **"Publish"**

Example location of rules file:
```
/KAPP/firestore.rules
```

---

## Security Rules Configuration

### Where to Paste Rules

1. Go to: Firebase Console → Firestore Database → **Rules** tab
2. Replace ALL content with the rules from `firestore.rules`
3. Click **Publish**

### Verifying Rules Are Applied

After publishing, test that:
- Unauthenticated users cannot read/write protected collections
- Patients can only read their own data
- Doctors can only read their authorized patients' data
- Admins have full access

---

## Firestore Indexes

Firestore requires indexes for certain queries. You must create these manually.

### Step 1: Navigate to Indexes

1. Go to Firebase Console → Firestore Database → **Indexes** tab

### Step 2: Create Required Indexes

Click **"Add Index"** and create the following indexes:

#### Index 1: Appointments Collection Group (for pending status query)

| Field | Index Type |
|-------|------------|
| **Collection group ID:** `appointments` | |
| `status` | Ascending |

**Query scope:** Collection group

#### Index 2: Appointments by DateTime (for ordering)

| Field | Index Type |
|-------|------------|
| **Collection ID:** `appointments` | |
| `dateTime` | Descending |

**Query scope:** Collection

#### Index 3: Ratings by Doctor (for doctor reviews)

| Field | Index Type |
|-------|------------|
| **Collection ID:** `ratings` | |
| `ratedId` | Ascending |
| `rating` | Ascending |

**Query scope:** Collection

#### Index 4: Chat Rooms by Participants

| Field | Index Type |
|-------|------------|
| **Collection ID:** `chatRooms` | |
| `participants` | Array contains |
| `status` | Ascending |

**Query scope:** Collection

### Alternative: Using Firebase CLI

You can also deploy indexes using the Firebase CLI:

```bash
firebase deploy --only firestore:indexes
```

This uses the `firestore.indexes.json` file in your repository.

---

## Required Collections

The following collections need to exist in Firestore. You can create them by adding a document to each.

### Collections to Create Manually

**Note:** Firestore creates collections automatically when you add the first document. However, for the app to work correctly, ensure these collections exist with at least one document:

#### 1. `users` Collection
Stores user roles and authentication mapping.

**Create a test document:**
```
Collection: users
Document ID: (any ID, like "test-user")
Fields:
  - email: "test@example.com"
  - role: "patient"
  - createdAt: (current timestamp)
```

#### 2. `treatments` Collection
Stores available medical services/treatments.

**Create a sample treatment:**
```
Collection: treatments
Document ID: (auto-generate)
Fields:
  - name: "General Consultation"
  - description: "Standard medical consultation"
  - category: "General"
  - createdAt: (current timestamp)
```

#### 3. `doctors` Collection
Stores doctor profiles.

**Create after a doctor signs up, or manually:**
```
Collection: doctors
Document ID: (must match the doctor's Firebase Auth UID)
Fields:
  - firstName: "John"
  - lastName: "Doe"
  - specialization: "General Practitioner"
  - email: "doctor@example.com"
  - status: "active"
```

#### 4. `staffCredentials` Collection
Stores staff login credentials (for staff login flow).

```
Collection: staffCredentials
Document ID: (any unique ID)
Fields:
  - email: "doctor@example.com"
  - role: "doctor"
  - accessCode: "YOUR_ACCESS_CODE"
```

#### 5. `faqs` Collection (Optional)
For FAQ page content.

```
Collection: faqs
Document ID: (auto-generate)
Fields:
  - question: "What are your operating hours?"
  - answer: "We are open Monday to Saturday, 9 AM to 5 PM."
  - order: 1
```

### Subcollections (Created Automatically)

These subcollections are created automatically by the app:

- `patients/{patientId}/appointments` - Patient's appointments
- `doctors/{doctorId}/services` - Doctor's service configurations
- `doctors/{doctorId}/customServices` - Doctor's custom services
- `doctors/{doctorId}/authorizedPatients` - Patients the doctor has approved
- `doctors/{doctorId}/patients` - Doctor's patient list

---

## Firebase Authentication Setup

### Step 1: Enable Email/Password Authentication

1. Go to Firebase Console → **Authentication** → **Sign-in method**
2. Click on **Email/Password**
3. Enable it and click **Save**

### Step 2: (Optional) Enable Other Providers

You can also enable:
- Google Sign-in
- Phone Authentication
- etc.

---

## Environment Variables

Create a `.env.local` file in your project root with Firebase configuration:

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

### Finding Your Firebase Config

1. Go to Firebase Console → Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click on the web app (or create one if not exists)
4. Copy the configuration values

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Permission denied" errors

**Cause:** Security rules not properly configured

**Solution:**
1. Go to Firebase Console → Firestore → Rules
2. Verify rules match `firestore.rules` in your repository
3. Click "Publish" after any changes

#### Issue: Appointments created but disappear after refresh

**Cause:** Security rules rejecting the write on the server

**Solution:**
1. Check browser console for Firebase errors
2. Verify the security rules allow the operation
3. Ensure user is properly authenticated

#### Issue: Doctor can't see patients in "My Patients"

**Cause:** The doctor needs to approve appointments first

**Solution:**
1. Have a patient book an appointment
2. Doctor approves the appointment from Dashboard
3. Patient will then appear in "My Patients"

#### Issue: Query requires an index

**Cause:** Missing Firestore index for the query

**Solution:**
1. Check browser console - Firebase provides a direct link to create the index
2. Click the link and create the index in Firebase Console
3. Wait ~5 minutes for index to build

#### Issue: Collection doesn't exist

**Cause:** Firestore collections are created automatically with the first document

**Solution:**
1. Add at least one document to the collection
2. The collection will appear after adding a document

---

## Quick Reference: Firebase Console URLs

- **Firestore Database:** Console → Build → Firestore Database
- **Security Rules:** Firestore Database → Rules tab
- **Indexes:** Firestore Database → Indexes tab
- **Authentication:** Console → Build → Authentication
- **Project Settings:** Gear icon at top of sidebar

---

## Deployment Checklist

Before going live, verify:

- [ ] Security rules are copied from `firestore.rules` to Firebase Console
- [ ] All required indexes are created
- [ ] Authentication is enabled
- [ ] Environment variables are set in production
- [ ] At least one admin user exists in `staffCredentials`
- [ ] `treatments` collection has service offerings
- [ ] Test a full booking flow end-to-end

---

## Support

If you encounter issues not covered here:
1. Check Firebase Console for error messages
2. Review browser developer console for Firebase errors
3. Verify security rules are correctly published
4. Ensure indexes are created and status shows "Enabled"
