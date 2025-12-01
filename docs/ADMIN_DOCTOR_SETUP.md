# Admin and Doctor Setup Guide

This guide explains how to add administrators and doctors to the KAPP medical clinic application.

## Overview

The KAPP application uses a simple access-code based system for staff authentication. Admins and doctors are registered in the `users` collection with an email, role, and access code.

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
3. You will be redirected to `/patient/dashboard`

### As a Staff Member (Admin or Doctor)
1. Go to `/staff/login`
2. Enter your registered email address
3. Select your role (Admin or Doctor)
4. Enter your access code (provided by administrator)
5. You will be redirected to the appropriate dashboard

## Adding an Admin

### Method 1: Using Firebase Console (Required for First Admin)

1. Go to your [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on **users** collection (create it if it doesn't exist)
5. Click **Add Document**
6. Set the **Document ID** to the admin's email in **lowercase** (e.g., `admin@example.com`)
7. Add the following fields:
   ```
   email: "admin@example.com" (string)
   role: "admin" (string)
   accessCode: "YOUR_ACCESS_CODE" (string) - e.g., "ADMIN123"
   name: "Admin Name" (string, optional)
   ```
8. Click **Save**

### Method 2: Using Admin Panel (After First Admin Exists)

1. Sign in as an existing admin at `/staff/login`
2. Navigate to `/admin/users`
3. Click **Add User**
4. Enter the email address and display name
5. Select **Admin** as the role
6. Click **Generate** to create an access code, or enter a custom one
7. Click **Add User**

Share the access code with the new admin. They can sign in at `/staff/login`.

## Adding a Doctor

### Method 1: Using Firebase Console

1. Go to your [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **users** collection
4. Click **Add Document**
5. Set the **Document ID** to the doctor's email in **lowercase** (e.g., `dr.smith@example.com`)
6. Add the following fields:
   ```
   email: "dr.smith@example.com" (string)
   role: "doctor" (string)
   accessCode: "YOUR_ACCESS_CODE" (string) - e.g., "DOC456"
   name: "Dr. John Smith" (string, optional)
   ```
7. Click **Save**

### Method 2: Using Admin Panel

1. Sign in as an admin at `/staff/login`
2. Navigate to `/admin/users`
3. Click **Add User**
4. Enter the doctor's email address and display name
5. Select **Doctor** as the role
6. Click **Generate** to create an access code
7. Click **Add User**

Share the access code with the new doctor. They can sign in at `/staff/login`.

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
  {
    id: 'doctor-2',
    firstName: 'John',
    lastName: 'Smith',
    specialization: 'Dermatology',
    email: 'dr.smith@example.com'
  }
];
```

## Important Notes

### Access Codes
- Access codes are stored in the user document in Firestore
- Each staff member should have a unique access code
- Access codes can be any alphanumeric string (recommended: 6+ characters)
- The admin panel can auto-generate codes for you

### Email Matching
- The **Document ID** in Firestore must be the email in **lowercase**
- The `email` field in the document should also be lowercase

### First Admin Bootstrap
Since no admin exists initially, you must add the first admin directly in Firebase Console with an access code. After that, the admin can add other admins and doctors through the UI.

### Doctor Profile
After a doctor is added to the `users` collection, they should:
1. Sign in at `/staff/login` with their email, select "Doctor", and enter their access code
2. Complete the onboarding process at `/doctor/onboarding`
3. Set up their services in `/doctor/my-services`

## Troubleshooting

### "No staff account found with this email"
- Verify the email exists in the `users` collection in Firestore
- Make sure the **Document ID** is the email in lowercase
- Check that the `role` field is exactly `admin` or `doctor`

### "Invalid access code"
- Verify the `accessCode` field in the Firestore document matches what the user entered
- Access codes are case-sensitive
- Check for leading/trailing spaces

### Cannot Access Admin/Doctor Pages After Login
- Try logging out and back in at `/staff/login`
- Clear browser localStorage and try again
- Verify the `role` field is set correctly (`admin` or `doctor`)

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

1. **Use strong access codes** - at least 6 characters, mix of letters and numbers
2. **Regularly rotate access codes** - change them periodically via the admin panel
3. **Remove access immediately** when a doctor/admin leaves - delete their user document
4. **Monitor** the users collection for unauthorized changes
5. **Use lowercase emails** consistently in Firestore documents

> **Security Note**: The staff login system uses access codes stored in Firestore that are readable by unauthenticated users. This is by design to enable login verification. Treat access codes like passwords - keep them confidential and rotate them regularly. For enhanced security in production, consider migrating to Firebase Authentication for staff accounts.
