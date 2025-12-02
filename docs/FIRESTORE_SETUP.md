# Firestore Database Setup Guide

This guide explains how to set up the Firestore database collections required for the KAPP medical clinic application.

## Overview

The KAPP application requires several Firestore collections to function properly. This document provides step-by-step instructions to create the necessary collections and seed data.

## Complete Collection Reference

Here is the complete list of collections and their relationships:

### Core Collections

| Collection | Document ID | Purpose |
|------------|-------------|---------|
| `users` | User's Firebase Auth UID | Stores user roles (patient/doctor/admin) |
| `patients` | User's Firebase Auth UID | Stores patient profile data |
| `doctors` | Doctor's Firebase Auth UID | Stores doctor profile data |
| `treatments` | Auto-generated or slugified name | Master list of clinic treatments |
| `appointments` | Auto-generated | Top-level appointment records (for doctor/admin access) |
| `staffCredentials` | Auto-generated | Staff login verification |
| `pendingStaff` | Email address | Pending staff invitations |

### Patient Subcollections

| Path | Purpose |
|------|---------|
| `/patients/{patientId}/appointments/{appointmentId}` | Patient's appointment records |
| `/patients/{patientId}/treatmentRecords/{recordId}` | Patient's medical consultation records |
| `/patients/{patientId}/prescriptions/{prescriptionId}` | Patient's prescriptions |

### Doctor Subcollections

| Path | Purpose |
|------|---------|
| `/doctors/{doctorId}/services/{treatmentId}` | Which standard treatments doctor provides + pricing |
| `/doctors/{doctorId}/customServices/{serviceId}` | Doctor's custom services |
| `/doctors/{doctorId}/patients/{patientId}` | Doctor's patient list with workflow status |
| `/doctors/{doctorId}/authorizedPatients/{patientId}` | Patients authorized for data access |
| `/doctors/{doctorId}/sessionLogs/{sessionId}` | Doctor session tracking logs |

## Required Collections - Detailed Setup

### 1. `treatments` Collection

This collection stores the master list of all procedures/treatments offered by the clinic.

**Path**: `/treatments/{treatmentId}`

**Structure**:
```typescript
{
  name: string;          // Treatment name (e.g., "Botox Injections")
  description: string;   // Description of the treatment
  category: string;      // Category (e.g., "Aesthetic", "General Medicine")
}
```

**Sample Data to Add**:
```json
[
  {
    "name": "Annual Physical Exam",
    "description": "A comprehensive check-up to assess your overall health and prevent potential health issues.",
    "category": "General Medicine"
  },
  {
    "name": "Vaccinations",
    "description": "Stay protected with essential vaccinations for flu, HPV, pneumonia, and more.",
    "category": "General Medicine"
  },
  {
    "name": "Chronic Disease Management",
    "description": "Ongoing care and support for managing conditions like diabetes, hypertension, and asthma.",
    "category": "General Medicine"
  },
  {
    "name": "Minor Injury Care",
    "description": "Treatment for non-life-threatening injuries such as cuts, sprains, and minor burns.",
    "category": "General Medicine"
  },
  {
    "name": "Botox Injections",
    "description": "Smooth out wrinkles and fine lines for a refreshed, youthful appearance.",
    "category": "Aesthetic"
  },
  {
    "name": "Dermal Fillers",
    "description": "Restore volume, contour facial features, and soften creases with hyaluronic acid fillers.",
    "category": "Aesthetic"
  },
  {
    "name": "Chemical Peels",
    "description": "Improve skin texture and tone by removing the outermost layers of the skin.",
    "category": "Aesthetic"
  },
  {
    "name": "Microneedling with PRP",
    "description": "Stimulate collagen production and enhance skin repair using your body's own growth factors.",
    "category": "Aesthetic"
  }
]
```

### 2. `users` Collection (IMPORTANT)

**This is the most critical collection for authentication and authorization.**

The document ID **MUST** be the user's Firebase Auth UID. This is how the security rules verify user roles.

**Path**: `/users/{userId}` (where userId = Firebase Auth UID)

**Structure**:
```typescript
{
  email: string;         // User's email (must match Firebase Auth token)
  role: 'patient' | 'doctor' | 'admin';
  createdAt: Timestamp;
}
```

**Important Notes**:
- When users sign up, they automatically get `role: 'patient'`
- Only admins can change a user's role to `doctor` or `admin`
- The document ID MUST be the Firebase Auth UID, NOT the email

### 3. `doctors` Collection

This collection stores doctor profiles and their service configurations.

**Path**: `/doctors/{doctorId}` (where doctorId = Firebase Auth UID)

**Structure**:
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
  phone?: string;
  specialization: string;
  licenseNumber?: string;
  bio?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'pending';
  onboardingCompleted?: boolean;
  defaultPatientStatus?: string;
  gamification?: {
    xp: number;
    level: number;
    totalConsultations: number;
    totalPatients: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: Timestamp;
    servicesConfigured?: number;
    servicesUpdatedAt?: Timestamp;
    appointmentsApproved?: number;
  };
}
```

**Subcollections**:

#### `/doctors/{doctorId}/services/{treatmentId}`
Tracks which standard treatments the doctor provides and their pricing.

```typescript
{
  treatmentId: string;       // References treatments collection
  providesService: boolean;  // Whether doctor offers this treatment
  price: number;             // Doctor's price for this treatment
}
```

#### `/doctors/{doctorId}/customServices/{serviceId}`
Custom services created by the doctor.

```typescript
{
  name: string;
  description: string;
  category: string;
  price: number;
  isCustom: boolean;         // Always true
  createdAt: string;         // ISO date string
  createdBy: string;         // Doctor's UID
  updatedAt?: string;
}
```

#### `/doctors/{doctorId}/patients/{patientId}`
Doctor's patient list with workflow status.

```typescript
{
  patientId: string;
  addedAt: Timestamp;
  status?: 'new' | 'accepted' | 'waiting_consultation' | 'in_consultation' | 'treated' | 'follow_up' | 'completed';
  statusUpdatedAt?: Timestamp;
}
```

#### `/doctors/{doctorId}/authorizedPatients/{patientId}`
Patients the doctor is authorized to access data for.

```typescript
{
  patientId: string;
  addedAt: Timestamp;
}
```

### 4. `patients` Collection

**Path**: `/patients/{patientId}` (where patientId = Firebase Auth UID)

**Structure**:
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  occupation?: string;
  medicalHistory?: string;
  aestheticGoals?: string;
  allergies?: string;
  appointmentCount?: number;
  firstVisitCelebrated?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

**Subcollections**:

#### `/patients/{patientId}/appointments/{appointmentId}`
Patient's appointment records.

```typescript
{
  bookingId: string;                    // Professional booking reference
  patientId: string;
  doctorId: string;
  serviceType: string;
  dateTime: string;                     // ISO date string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  paymentStatus: 'pending_payment' | 'paid' | 'refunded';
  paymentIntentId?: string;             // Stripe payment reference
  originalPrice: number;
  finalPrice: number;
  phoneNumber: string;
  medicalCondition?: string;
  patientNotes?: string;
  doctorNoteToPatient?: string;
  doctorNoteToAdmin?: string;
  couponCode?: string;
  couponDiscount?: number;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  // Reschedule fields
  timeRescheduled?: boolean;
  originalDateTime?: string;
  rescheduledBy?: 'doctor' | 'patient';
  rescheduledAt?: Timestamp;
  rescheduledTime?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5. `appointments` Collection (Top-Level)

Denormalized copy of appointments for doctor/admin access.

**Path**: `/appointments/{appointmentId}`

Same structure as patient appointments, plus:
```typescript
{
  id: string;   // The appointment document ID
  // ... all appointment fields
}
```

### 6. `staffCredentials` Collection

For staff login verification.

**Path**: `/staffCredentials/{credentialId}`

```typescript
{
  email: string;
  role: 'admin' | 'doctor';
  accessCode: string;
  name: string;
  isActive: boolean;
}
```

### 7. `pendingStaff` Collection

For pending staff invitations.

**Path**: `/pendingStaff/{email}`

```typescript
{
  email: string;
  role: 'admin' | 'doctor';
  invitedAt: Timestamp;
  invitedBy: string;
}
```

## Setup Instructions

### Option 1: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `studio-8822072999-a4137`
3. Navigate to **Firestore Database**
4. Click **Start Collection** for each collection listed above
5. Add sample documents with the structure shown

### Option 2: Using the Admin Panel

1. Log into the admin panel at `/admin/dashboard`
2. Navigate to **Procedures** to add treatments
3. Navigate to **Doctors** to add doctor profiles
4. The application will automatically create other collections as users interact

### Option 3: Using the Seed Script (Recommended)

Run the following command to seed the database with initial data:

```bash
npm run seed:firestore
```

This script creates the `treatments` collection with all default procedures.

## Create Seed Script

Create a new file `scripts/seed-firestore.ts`:

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert('./service-account.json'),
  projectId: 'studio-8822072999-a4137'
});

const db = getFirestore(app);

const treatments = [
  {
    name: 'Annual Physical Exam',
    description: 'A comprehensive check-up to assess your overall health and prevent potential health issues.',
    category: 'General Medicine'
  },
  {
    name: 'Vaccinations',
    description: 'Stay protected with essential vaccinations for flu, HPV, pneumonia, and more.',
    category: 'General Medicine'
  },
  {
    name: 'Chronic Disease Management',
    description: 'Ongoing care and support for managing conditions like diabetes, hypertension, and asthma.',
    category: 'General Medicine'
  },
  {
    name: 'Minor Injury Care',
    description: 'Treatment for non-life-threatening injuries such as cuts, sprains, and minor burns.',
    category: 'General Medicine'
  },
  {
    name: 'Botox Injections',
    description: 'Smooth out wrinkles and fine lines for a refreshed, youthful appearance.',
    category: 'Aesthetic'
  },
  {
    name: 'Dermal Fillers',
    description: 'Restore volume, contour facial features, and soften creases with hyaluronic acid fillers.',
    category: 'Aesthetic'
  },
  {
    name: 'Chemical Peels',
    description: 'Improve skin texture and tone by removing the outermost layers of the skin.',
    category: 'Aesthetic'
  },
  {
    name: 'Microneedling with PRP',
    description: "Stimulate collagen production and enhance skin repair using your body's own growth factors.",
    category: 'Aesthetic'
  }
];

async function seedTreatments() {
  console.log('Seeding treatments collection...');
  
  for (const treatment of treatments) {
    const docRef = await db.collection('treatments').add(treatment);
    console.log(`Added treatment: ${treatment.name} (${docRef.id})`);
  }
  
  console.log('✅ Treatments seeded successfully!');
}

async function main() {
  try {
    await seedTreatments();
    console.log('\\n✅ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
```

Add the script to `package.json`:
```json
"scripts": {
  "seed:firestore": "tsx ./scripts/seed-firestore.ts"
}
```

## Verification

After setting up, verify the collections:

1. **Treatments**: Check that all 8 treatments appear in the doctor's "My Services" page
2. **Appointments**: Book a test appointment and verify it appears in the doctor dashboard
3. **Doctors**: Ensure doctor profiles are created when doctors log in

## Troubleshooting

### "No treatments showing in My Services"

1. Check that the `treatments` collection exists in Firestore
2. Verify at least one document exists with `name`, `description`, and `category` fields
3. Ensure Firestore security rules allow authenticated users to read treatments

### "Appointments not showing in dashboard"

1. Verify appointments are being created in both:
   - `/patients/{patientId}/appointments/{appointmentId}` 
   - `/appointments/{appointmentId}`
2. Check that the `status` field is set correctly
3. Ensure the doctor has the correct role in Firestore

### "Access denied errors"

1. Review `firestore.rules` for proper permission setup
2. Ensure users have the correct role in the `users` collection
3. Check that the user's Firebase Auth UID matches their document ID

### "Custom services not appearing in booking"

1. Ensure the custom service has `createdBy` field set to the doctor's UID
2. Verify the doctor has `status: 'active'` or `onboardingCompleted: true`
3. Check that the customServices subcollection exists under the doctor's document

### "Doctor not available as option"

1. Verify the doctor document exists in `/doctors/{doctorId}` where doctorId = Firebase Auth UID
2. Check that `status` is 'active' or `onboardingCompleted` is true
3. Ensure the doctor has configured at least one service in their `/services` subcollection

## Additional Collections

### 8. `chatRooms` Collection

For doctor-patient messaging.

**Path**: `/chatRooms/{roomId}`

```typescript
{
  participants: string[];    // Array of user UIDs
  patientId: string;
  doctorId: string;
  status: 'open' | 'closed';
  createdAt: Timestamp;
  lastMessageAt?: Timestamp;
}
```

**Subcollection**: `/chatRooms/{roomId}/messages/{messageId}`
```typescript
{
  senderId: string;
  content: string;
  createdAt: Timestamp;
  read?: boolean;
}
```

### 9. `ratings` Collection

Patient ratings for consultations.

**Path**: `/ratings/{ratingId}`

```typescript
{
  raterId: string;           // Patient UID
  ratedId: string;           // Doctor UID
  appointmentId?: string;
  rating: number;            // 1-5
  comment?: string;
  createdAt: Timestamp;
}
```

### 10. `reports` Collection

Patient/user reports filed by doctors.

**Path**: `/reports/{reportId}`

```typescript
{
  reporterId: string;        // Doctor UID
  reportedId: string;        // Patient UID
  reason: string;
  createdAt: string;
}
```

### 11. `discountCodes` Collection

Coupon/discount codes for bookings.

**Path**: `/discountCodes/{codeId}`

```typescript
{
  code: string;              // The coupon code (uppercase)
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
  expiresAt?: string;        // ISO date
  usageLimit?: number;
  usageCount: number;
  criteriaType?: 'none' | 'service' | 'category' | 'minimum_amount' | 'returning_client';
  serviceId?: string;
  categorySlug?: string;
  minimumAmount?: number;
  minAppointmentCount?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### 12. `announcements` Collection

System announcements for users.

**Path**: `/announcements/{announcementId}`

```typescript
{
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}
```

### 13. `featureFlags` Collection

Feature toggles for the application.

**Path**: `/featureFlags/{flagId}`

```typescript
{
  name: string;
  enabled: boolean;
  description?: string;
}
```

### 14. `auditLogs` Collection

Audit trail for admin actions.

**Path**: `/auditLogs/{logId}`

```typescript
{
  action: string;
  performedBy: string;       // Admin UID
  targetType: string;        // 'user' | 'doctor' | 'appointment' etc.
  targetId: string;
  details: Record<string, any>;
  createdAt: Timestamp;
}
```

## Gamification System

The gamification system tracks doctor and patient progress using embedded objects in their profile documents.

### Doctor Gamification Fields

Located in `/doctors/{doctorId}`:

```typescript
gamification: {
  xp: number;                    // Experience points
  level: number;                 // Current level
  totalConsultations: number;    // Total completed consultations
  totalPatients: number;         // Unique patients seen
  currentStreak: number;         // Current daily streak
  longestStreak: number;         // Best streak achieved
  lastActivityAt: Timestamp;     // Last activity timestamp
  servicesConfigured: number;    // Number of services configured
  servicesUpdatedAt: Timestamp;  // Last service update
  appointmentsApproved: number;  // Total approved appointments
}
```

### Patient Gamification

Tracked via the following fields in `/patients/{patientId}`:

```typescript
{
  appointmentCount: number;      // Used for badges and level
  firstVisitCelebrated: boolean; // Show first visit celebration
}
```

Patient badges are calculated client-side based on:
- First visit (1+ appointment)
- Health Hero (5+ appointments)  
- Wellness Warrior (10+ appointments)
- Profile Complete (all fields filled)
- Prepared Patient (has added notes to appointment)

## Data Flow Summary

### Booking Flow
1. Patient selects service → checks `treatments` + doctors' `services` + `customServices`
2. Patient selects doctor → shows only doctors who provide the service
3. Patient selects date/time → checks `appointments` for availability
4. Payment → creates appointment in `/patients/{patientId}/appointments` AND `/appointments`
5. Doctor approves/reschedules → updates both locations

### Doctor Service Configuration Flow
1. Admin adds treatment to `treatments` collection
2. Doctor goes to "My Services" page
3. Doctor enables treatment and sets price → writes to `/doctors/{doctorId}/services/{treatmentId}`
4. Doctor creates custom service → writes to `/doctors/{doctorId}/customServices/{serviceId}`
5. Patients see available services when booking

### Availability System
- When doctor approves appointment with status 'confirmed', that time slot becomes unavailable
- Booking page checks `/appointments` where `status == 'confirmed'` for the selected doctor/date
- Unavailable time slots are grayed out in the booking calendar

## Security Rules

The Firestore security rules are defined in `firestore.rules`. Key points:

- Only authenticated users can read treatments
- Doctors can only read/write their own profile and services
- Patients can only access their own appointments
- Admins have elevated access to all collections
- Document IDs for users/patients/doctors MUST match Firebase Auth UIDs

---

**Last Updated**: December 2024
