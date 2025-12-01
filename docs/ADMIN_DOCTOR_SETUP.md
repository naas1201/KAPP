# Admin and Doctor Setup Guide

This guide explains how to add administrators and doctors to the KAPP medical clinic application.

## Overview

The KAPP application uses **Firebase Authentication** combined with **Firestore role-based access control**. 

Key points:
- All users (patients, doctors, admins) authenticate via Firebase Auth with email/password
- User roles are stored in the `users/{uid}` collection where `{uid}` is the Firebase Auth UID
- The Auth UID is the **source of truth** for role lookups
- Firestore security rules enforce role-based access control

## Login Pages

The application has the following login pages:

| Role | Login URL | Redirects To |
|------|-----------|--------------|
| **Patient** | `/login` | `/patient/dashboard` |
| **Staff (Admin/Doctor)** | `/staff/login` | `/admin` or `/doctor/dashboard` |

Legacy routes `/admin/login` and `/doctor/login` automatically redirect to `/staff/login`.

## How to Login

### As a Patient
1. Go to `/login` (the main login page)
2. Sign in with email/password or Google
3. A user document is automatically created in Firestore with `role: 'patient'`
4. You will be redirected to `/patient/dashboard`

### As a Staff Member (Admin or Doctor)
1. Go to `/staff/login`
2. Enter your registered email and password
3. The system reads your role from `users/{uid}` in Firestore
4. You will be redirected based on your role:
   - Admins → `/admin`
   - Doctors → `/doctor/dashboard`

## Adding an Admin

### Method 1: Using Firebase Console (Required for First Admin)

Since no admin exists initially, you must add the first admin directly in Firebase.

**Step 1: Create the Firebase Auth User**
1. Go to your [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add user**
5. Enter the admin's email and password
6. Click **Add user**
7. **Copy the UID** shown for this user (you'll need it in the next step)

**Step 2: Create the Firestore User Document**
1. Navigate to **Firestore Database**
2. Click on **users** collection (create it if it doesn't exist)
3. Click **Add Document**
4. **Set the Document ID to the UID** from Step 1 (NOT the email!)
5. Add the following fields:
   ```
   email: "admin@example.com" (string) - lowercase
   role: "admin" (string)
   name: "Admin Name" (string)
   ```
6. Click **Save**

### Method 2: Using the Seeding Script (For Development/Testing)

Run the production staff accounts script:

```bash
# For emulator:
export FIRESTORE_EMULATOR_HOST=localhost:8080
export AUTH_EMULATOR_HOST=localhost:9099
npm run seed:prod-staff-accounts

# For production (requires service account):
export FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccount.json
export PROCEED_WITH_HARD_CODED_PROD_ACCOUNTS=1
NODE_ENV=production npm run seed:prod-staff-accounts
```

This creates:
- `admin@lpp.ovh` with password `1q2w3e4r5t6y` and role `admin`
- `doctor@lpp.ovh` with password `1q2w3e4r5t6y` and role `doctor`

⚠️ **WARNING**: Change these passwords before deploying to production!

### Method 3: Using Admin Panel (After First Admin Exists)

1. Sign in as an existing admin at `/staff/login`
2. Navigate to `/admin/users`
3. Click **Add User**
4. Enter the email address, password, and display name
5. Select **Admin** as the role
6. Click **Add User**

The admin panel creates both the Firebase Auth user and the Firestore document.

## Adding a Doctor

### Method 1: Using Firebase Console

Follow the same steps as adding an admin, but:
- Set the `role` field to `"doctor"` instead of `"admin"`

### Method 2: Using Admin Panel

1. Sign in as an admin at `/staff/login`
2. Navigate to `/admin/users`
3. Click **Add User**
4. Enter the doctor's email address, password, and display name
5. Select **Doctor** as the role
6. Click **Add User**

### Method 3: Add to Static Doctor List (for booking dropdown)

To add doctors to the booking dropdown, edit `src/lib/data.ts`:

```typescript
export const doctors: Doctor[] = [
  {
    id: 'doctor-1',
    firstName: 'Katheryne',
    lastName: 'Castillo',
    specialization: 'General Medicine & Aesthetics',
    email: 'dr.castillo@example.com'
  },
  // Add new doctors here
];
```

## Important Notes

### Document ID Must Be Auth UID

The **Document ID** in the `users` collection MUST be the Firebase Auth UID, not the email. This is critical for Firestore security rules to work correctly.

**Correct:**
```
users/
  └── abc123XYZ789  (UID from Firebase Auth)
        ├── email: "admin@example.com"
        └── role: "admin"
```

**Incorrect:**
```
users/
  └── admin@example.com  (Don't use email as document ID!)
        └── ...
```

### Role Values

Valid role values are:
- `"admin"` - Full system access
- `"doctor"` - Access to patient data they're authorized for
- `"patient"` - Access to their own data only

### Firestore Security Rules

The security rules use helper functions to check roles:

```javascript
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

### Doctor Profile

After a doctor is added, they should:
1. Sign in at `/staff/login` with their email and password
2. Complete the onboarding process at `/doctor/onboarding`
3. Set up their services in `/doctor/my-services`

## Troubleshooting

### "No staff profile found"
- Verify the user document exists in `users/{uid}` collection
- Make sure the **Document ID** is the Auth UID (not email)
- Check that the `role` field is exactly `admin` or `doctor`

### "This is a patient account"
- The user's role in Firestore is set to `patient`
- An admin needs to update the role to `admin` or `doctor`

### Cannot Access Admin/Doctor Pages After Login
- Check browser console for errors
- Verify the Firestore security rules are deployed
- Clear browser localStorage and try again

### Firestore Security Rules Errors
Run the rules tests to verify:
```bash
firebase emulators:start --only firestore &
npm run test:rules
```

## Quick Reference

| Action | URL |
|--------|-----|
| Patient Login | `/login` |
| Staff Login (Admin/Doctor) | `/staff/login` |
| Patient Dashboard | `/patient/dashboard` |
| Doctor Dashboard | `/doctor/dashboard` |
| Admin Dashboard | `/admin` |
| Forgot Password | `/forgot-password` |
| Patient Sign Up | `/signup` |

## Security Best Practices

1. **Use strong passwords** - at least 8 characters with mix of letters, numbers, symbols
2. **Enable email verification** in Firebase Auth settings
3. **Regularly audit user roles** via the admin panel
4. **Remove access immediately** when a doctor/admin leaves - delete their Auth user and Firestore document
5. **Use the Auth UID** consistently as document IDs in Firestore
6. **Run security rules tests** before deploying rule changes
7. **No hardcoded access codes** - all authentication goes through Firebase Auth

## Testing Security Rules

The repository includes Jest tests for Firestore security rules:

```bash
# Start the emulator
firebase emulators:start --only firestore &

# Run the tests
npm run test:rules
```

These tests verify:
- Unauthenticated users cannot access protected data
- Admins can read/write staff data
- Doctors can only access authorized patient data
- Patients can only access their own records
- Users cannot self-assign admin/doctor roles during signup
