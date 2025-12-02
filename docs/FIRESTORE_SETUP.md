# Firestore Database Setup Guide

This guide explains how to set up the Firestore database collections required for the KAPP medical clinic application.

## Overview

The KAPP application requires several Firestore collections to function properly. This document provides step-by-step instructions to create the necessary collections and seed data.

## Required Collections

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

### 2. `doctors` Collection

This collection stores doctor profiles and their services.

**Path**: `/doctors/{doctorId}`

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
  defaultPatientStatus?: string;
  gamification?: {
    xp: number;
    level: number;
    totalConsultations: number;
    totalPatients: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: Timestamp;
  };
}
```

**Subcollections**:
- `/doctors/{doctorId}/services/{treatmentId}` - Doctor's service offerings
- `/doctors/{doctorId}/customServices/{serviceId}` - Doctor's custom services
- `/doctors/{doctorId}/patients/{patientId}` - Doctor's patient list
- `/doctors/{doctorId}/authorizedPatients/{patientId}` - Authorized patients for access control

### 3. `appointments` Collection

Top-level appointments for doctor/admin access.

**Path**: `/appointments/{appointmentId}`

**Structure**:
```typescript
{
  patientId: string;
  doctorId: string;
  serviceType: string;
  dateTime: string;      // ISO date string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  originalPrice: number;
  finalPrice: number;
  phoneNumber: string;
  medicalCondition?: string;
  patientNotes?: string;
  doctorNoteToPatient?: string;
  doctorNoteToAdmin?: string;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4. `patients` Collection

This collection stores patient profiles.

**Path**: `/patients/{patientId}`

**Structure**:
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  appointmentCount?: number;
  createdAt: Timestamp;
}
```

**Subcollections**:
- `/patients/{patientId}/appointments/{appointmentId}` - Patient's appointments

### 5. `users` Collection

This collection stores user roles and authentication info.

**Path**: `/users/{userId}`

**Structure**:
```typescript
{
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt: Timestamp;
}
```

### 6. `staffCredentials` Collection

This collection stores staff login credentials.

**Path**: `/staffCredentials/{credentialId}`

**Structure**:
```typescript
{
  email: string;
  role: 'admin' | 'doctor';
  accessCode: string;
  name: string;
  isActive: boolean;
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

## Security Rules

The Firestore security rules are defined in `firestore.rules`. Key points:

- Only authenticated users can read treatments
- Doctors can only read/write their own profile and services
- Patients can only access their own appointments
- Admins have elevated access to all collections

---

**Last Updated**: December 2024
