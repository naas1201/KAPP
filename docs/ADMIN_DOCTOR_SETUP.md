# Admin and Doctor Setup Guide

This guide explains how to add administrators and doctors to the KAPP medical clinic application.

## Overview

The KAPP application uses Firebase Authentication for user sign-in and Firestore for role-based access control. Admins and doctors are recognized by their email addresses stored in the `users` collection.

## How Role Recognition Works

1. When a user signs in (via email/password or Google), the app checks the `users` collection in Firestore
2. If a document exists with the user's email as the document ID, the user is assigned that role
3. The app automatically redirects users to their appropriate dashboard:
   - **Admin** → `/admin`
   - **Doctor** → `/doctor/dashboard`
   - **Patient** → `/patient/dashboard`

## Adding an Admin

### Method 1: Using Firebase Console (Recommended for First Admin)

1. Go to your [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on **users** collection (create it if it doesn't exist)
5. Click **Add Document**
6. Set the **Document ID** to the admin's email (e.g., `admin@example.com`)
7. Add the following fields:
   ```
   email: "admin@example.com" (string)
   role: "admin" (string)
   ```
8. Click **Save**

### Method 2: Using Admin Panel (After First Admin Exists)

1. Sign in as an existing admin
2. Navigate to `/admin/users`
3. Click **Invite User**
4. Enter the email address
5. Select **Admin** as the role
6. Click **Send Invitation**

The new admin can now sign up or sign in with Google using that email address.

## Adding a Doctor

### Method 1: Using Firebase Console

1. Go to your [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **users** collection
4. Click **Add Document**
5. Set the **Document ID** to the doctor's email (e.g., `dr.smith@example.com`)
6. Add the following fields:
   ```
   email: "dr.smith@example.com" (string)
   role: "doctor" (string)
   ```
7. Click **Save**

### Method 2: Using Admin Panel

1. Sign in as an admin
2. Navigate to `/admin/users`
3. Click **Invite User**
4. Enter the doctor's email address
5. Select **Doctor** as the role
6. Click **Send Invitation**

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

## Firestore Security

The `users` collection is protected by Firestore security rules:

- **Admins** can read and write all user documents
- **Users** can read their own role document (where document ID matches their email)
- **Users** can create their own document on signup (with matching email, patient role only)
- **Doctors** can read their own role document to authenticate

This allows the login flow to check user roles without requiring admin privileges.

## Important Notes

### Email Matching
- The email used in the Firestore document must **exactly match** the email used for Firebase Authentication
- Email matching is case-sensitive in Firestore, so use lowercase
- For Google sign-in, use the full Gmail address

### First Admin Bootstrap
Since no admin exists initially, you must add the first admin directly in Firebase Console. After that, the admin can invite other admins and doctors through the UI.

### Doctor Profile
After a doctor is added to the `users` collection, they should:
1. Sign up or sign in with their email
2. Navigate to `/doctor/onboarding` to complete their profile
3. Set up their services in `/doctor/my-services`

## Troubleshooting

### User Not Redirected to Correct Dashboard
- Verify the email in `users` collection matches exactly (case-sensitive)
- Check if the document has the correct `role` field
- Clear browser cache and sign in again

### Cannot Access Admin/Doctor Pages
- Ensure the user is signed in
- Verify the `role` field is set correctly (`admin` or `doctor`)
- Check browser console for Firestore permission errors

### Firestore Permission Denied
- The `users` collection might not have proper security rules
- Verify the `firestore.rules` file is deployed

## Security Best Practices

1. **Never** share admin credentials
2. **Regularly** audit the users collection for unauthorized changes
3. **Use** strong passwords or Google authentication
4. **Remove** access immediately when a doctor/admin leaves
5. **Monitor** Firebase Authentication logs for suspicious activity
