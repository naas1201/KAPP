# Admin and Doctor Setup Guide

This guide explains how to add administrators and doctors to the KAPP medical clinic application.

## Overview

The KAPP application uses Firebase Authentication for user sign-in and Firestore for role-based access control. Admins and doctors are recognized by their email addresses stored in the `users` collection.

## Login Pages

The application has **separate login pages** for different user roles:

| Role | Login URL | Redirects To |
|------|-----------|--------------|
| **Patient** | `/login` | `/patient/dashboard` |
| **Doctor** | `/doctor/login` | `/doctor/dashboard` |
| **Admin** | `/admin/login` | `/admin` |

This design provides:
- Clear separation of access points
- Explicit role verification at login time
- Better error messages when using the wrong login page
- Seamless integration with Firebase Authentication

## How to Login

### As a Patient
1. Go to `/login` (the main login page)
2. Sign in with email/password or Google
3. You will be redirected to `/patient/dashboard`

### As a Doctor
1. Go to `/doctor/login`
2. Sign in with the email registered for the doctor role
3. The system verifies you have `role: "doctor"` in the `users` collection
4. You will be redirected to `/doctor/dashboard`

### As an Admin
1. Go to `/admin/login`
2. Sign in with the email registered for the admin role
3. The system verifies you have `role: "admin"` in the `users` collection
4. You will be redirected to `/admin`

## Adding an Admin

### Method 1: Using Firebase Console (Recommended for First Admin)

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
   ```
8. Click **Save**
9. The user must also exist in Firebase Authentication - create them via the Authentication tab or have them sign up

### Method 2: Using Admin Panel (After First Admin Exists)

1. Sign in as an existing admin at `/admin/login`
2. Navigate to `/admin/users`
3. Click **Invite User**
4. Enter the email address
5. Select **Admin** as the role
6. Click **Send Invitation**

The new admin can now sign in at `/admin/login` using that email address.

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
   ```
7. Click **Save**

### Method 2: Using Admin Panel

1. Sign in as an admin at `/admin/login`
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
- The **Document ID** in Firestore must be the email in **lowercase**
- The `email` field in the document should also be lowercase
- Firebase Auth emails are automatically normalized to lowercase during login

### First Admin Bootstrap
Since no admin exists initially, you must add the first admin directly in Firebase Console. After that, the admin can invite other admins and doctors through the UI.

### Doctor Profile
After a doctor is added to the `users` collection, they should:
1. Sign in at `/doctor/login` with their email
2. Complete the onboarding process at `/doctor/onboarding`
3. Set up their services in `/doctor/my-services`

## Troubleshooting

### "No admin/doctor account found for this email"
- Verify the email exists in the `users` collection in Firestore
- Make sure the **Document ID** is the email in lowercase
- Check that the `role` field is exactly `admin` or `doctor`

### User Logged In But Access Denied
- The user may be using the wrong login page
- Verify the `role` field matches the login page being used
- Check browser console for specific error messages

### Cannot Access Admin/Doctor Pages After Login
- Ensure the user is signed in via the correct login page
- Verify the `role` field is set correctly (`admin` or `doctor`)
- Check browser console for Firestore permission errors

### Firestore Permission Denied
- The `users` collection might not have proper security rules
- Verify the `firestore.rules` file is deployed
- Ensure the user can read their own document (email match)

## Quick Reference

| Action | URL |
|--------|-----|
| Patient Login | `/login` |
| Doctor Login | `/doctor/login` |
| Admin Login | `/admin/login` |
| Patient Dashboard | `/patient/dashboard` |
| Doctor Dashboard | `/doctor/dashboard` |
| Admin Dashboard | `/admin` |
| Forgot Password | `/forgot-password` |
| Patient Sign Up | `/signup` |

## Security Best Practices

1. **Never** share admin credentials
2. **Regularly** audit the users collection for unauthorized changes
3. **Use** strong passwords or Google authentication
4. **Remove** access immediately when a doctor/admin leaves
5. **Monitor** Firebase Authentication logs for suspicious activity
6. **Use lowercase emails** consistently in Firestore documents
