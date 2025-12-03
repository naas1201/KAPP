# API Reference

This document provides a comprehensive reference for all data entities and Firestore collections used in the KAPP Medical Booking Application.

## Table of Contents

1. [Authentication](#authentication)
2. [Core Entities](#core-entities)
3. [Collection Paths](#collection-paths)
4. [Data Schemas](#data-schemas)
5. [Relationships](#relationships)

---

## Authentication

### Supported Providers

| Provider | Description |
|----------|-------------|
| `password` | Email/Password authentication |
| `google.com` | Google OAuth authentication |

### User Roles

| Role | Access Level |
|------|--------------|
| `admin` | Full system access |
| `doctor` | Patient data, appointments, services |
| `patient` | Own data only |

---

## Core Entities

### User

Represents a registered user in the system (admin or doctor role).

```typescript
interface User {
  email: string;           // User's email address
  role: 'admin' | 'doctor';
}
```

### Patient

Represents a patient in the system.

```typescript
interface Patient {
  firstName: string;       // Required
  lastName: string;        // Required
  dateOfBirth: string;     // Required (ISO date format)
  email: string;           // Required
  phone: string;           // Required
  address?: string;
  occupation?: string;
  medicalHistory?: string;
  aestheticGoals?: string;
  allergies?: string;
  appointmentCount?: number;
  firstVisitCelebrated?: boolean;
  relatedPatientIds?: string[];  // Family members
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### Doctor

Represents a doctor in the system.

```typescript
interface Doctor {
  firstName: string;       // Required
  lastName: string;        // Required
  specialization: string;  // Required
  email: string;           // Required
  displayName?: string;
  phone?: string;
  licenseNumber?: string;
  bio?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'pending';
  onboardingCompleted?: boolean;
  defaultPatientStatus?: string;
  gamification?: DoctorGamification;
}

interface DoctorGamification {
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
}
```

### Appointment

Represents an appointment booking.

```typescript
interface Appointment {
  patientId: string;       // Required
  doctorId: string;        // Required
  serviceType: string;     // Required
  dateTime: string;        // Required (ISO datetime)
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  bookingId?: string;      // Professional booking reference
  paymentStatus?: 'pending_payment' | 'paid' | 'refunded';
  paymentIntentId?: string;
  originalPrice?: number;
  finalPrice?: number;
  phoneNumber?: string;
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

### Treatment

Master treatment/procedure offered by the clinic.

```typescript
interface Treatment {
  name: string;            // Required
  description: string;     // Required
  category: string;        // Required (e.g., 'Aesthetic', 'General Medicine')
}
```

### DoctorService

Links a doctor to a treatment with pricing.

```typescript
interface DoctorService {
  treatmentId: string;     // Required
  providesService: boolean;
  price: number;
}
```

### TreatmentRecord

Medical consultation record.

```typescript
interface TreatmentRecord {
  patientId: string;       // Required
  doctorId: string;        // Required
  date: string;            // Required (ISO date)
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  personalAndSocialHistory?: string;
  skinCareRoutine?: string;
  diagnosis: string;       // Required
  treatmentPlan: string;   // Required
}
```

### Prescription

Medical prescription.

```typescript
interface Prescription {
  doctorId: string;        // Required
  patientId: string;       // Required
  drugName: string;        // Required
  genericName?: string;
  dosage: string;          // Required
  frequency: string;       // Required
  duration?: string;
  quantity?: number;
  route?: string;          // oral, topical, injection, etc.
  instructions?: string;
  isControlled?: boolean;
  notes?: string;
  createdAt: string;       // Required (ISO datetime)
  expiresAt: string;       // Required (ISO datetime)
}
```

### ChatRoom

Private messaging room between doctor and patient.

```typescript
interface ChatRoom {
  doctorId: string;        // Required
  patientId: string;       // Required
  participants: string[];  // Required [doctorId, patientId]
  status: 'open' | 'closed';
  lastMessageText?: string;
  lastActivity?: Timestamp;
  doctorUnreadCount?: number;
  patientUnreadCount?: number;
  createdAt: Timestamp;
}
```

### ChatMessage

Message within a chat room.

```typescript
interface ChatMessage {
  senderId: string;        // Required
  text?: string;
  imageUrl?: string;
  fileUrl?: string;
  createdAt: Timestamp;    // Required
  readByPatient?: boolean;
}
```

### Rating

Consultation rating.

```typescript
interface Rating {
  consultationId: string;  // Required
  ratedId: string;         // Required (doctor or patient UID)
  raterId: string;         // Required
  rating: number;          // Required (1-5)
  comment?: string;
  createdAt: Timestamp;    // Required
}
```

### Report

Report filed against a user.

```typescript
interface Report {
  reporterId: string;      // Required (doctor UID)
  reportedId: string;      // Required (patient UID)
  reason: string;          // Required
  createdAt: string;       // Required (ISO datetime)
}
```

### Lead

Lead captured through forms.

```typescript
interface Lead {
  firstName: string;       // Required
  lastName: string;        // Required
  email: string;           // Required
  phone: string;           // Required
  source: string;          // Required (e.g., 'Website', 'Messenger')
  serviceInterest?: string;
  patientId?: string;      // If converted to patient
  paymentIntentId?: string;
  paymentStatus?: string;
  createdAt: Timestamp;
}
```

### FAQ

Frequently asked question.

```typescript
interface FAQ {
  treatmentName: string;   // Required
  question: string;        // Required
  answer: string;          // Required
  order?: number;
}
```

### DiscountCode

Coupon/discount code for bookings.

```typescript
interface DiscountCode {
  code: string;            // Required (uppercase)
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
  expiresAt?: string;      // ISO date
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

### VideoCall

WebRTC video call session.

```typescript
interface VideoCall {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  doctorCandidates?: RTCIceCandidateInit[];
  patientCandidates?: RTCIceCandidateInit[];
  status: 'pending' | 'active' | 'completed' | 'declined';
}
```

---

## Collection Paths

### Top-Level Collections

| Path | Schema | Description |
|------|--------|-------------|
| `/users/{userId}` | User | User roles (doc ID = Auth UID) |
| `/patients/{patientId}` | Patient | Patient profiles (doc ID = Auth UID) |
| `/doctors/{doctorId}` | Doctor | Doctor profiles (doc ID = Auth UID) |
| `/treatments/{treatmentId}` | Treatment | Master treatment list |
| `/appointments/{appointmentId}` | Appointment | Denormalized appointments |
| `/leads/{leadId}` | Lead | Lead capture data |
| `/faqs/{faqId}` | FAQ | FAQ content |
| `/video-calls/{roomId}` | VideoCall | WebRTC signaling |
| `/chatRooms/{roomId}` | ChatRoom | Chat rooms |
| `/ratings/{ratingId}` | Rating | Consultation ratings |
| `/reports/{reportId}` | Report | User reports |
| `/discountCodes/{codeId}` | DiscountCode | Discount codes |
| `/announcements/{announcementId}` | Announcement | System announcements |
| `/featureFlags/{flagId}` | FeatureFlag | Feature toggles |
| `/auditLogs/{logId}` | AuditLog | Admin action logs |
| `/staffCredentials/{credentialId}` | StaffCredential | Staff login data |
| `/pendingStaff/{email}` | PendingStaff | Staff invitations |
| `/prescriptions/{prescriptionId}` | Prescription | Denormalized prescriptions |

### Subcollections

| Path | Schema | Description |
|------|--------|-------------|
| `/patients/{patientId}/appointments/{appointmentId}` | Appointment | Patient's appointments |
| `/patients/{patientId}/treatmentRecords/{recordId}` | TreatmentRecord | Patient's treatment history |
| `/patients/{patientId}/prescriptions/{prescriptionId}` | Prescription | Patient's prescriptions |
| `/doctors/{doctorId}/services/{treatmentId}` | DoctorService | Doctor's service configs |
| `/doctors/{doctorId}/customServices/{serviceId}` | CustomService | Doctor's custom services |
| `/doctors/{doctorId}/patients/{patientId}` | DoctorPatient | Doctor's patient list |
| `/doctors/{doctorId}/authorizedPatients/{patientId}` | AuthorizedPatient | ACL entries |
| `/doctors/{doctorId}/sessionLogs/{sessionId}` | SessionLog | Session tracking |
| `/chatRooms/{roomId}/messages/{messageId}` | ChatMessage | Chat messages |

---

## Relationships

```
Patient 1:N Appointment
Patient 1:N TreatmentRecord
Patient 1:N Prescription
Patient N:N Patient (related family members)

Doctor 1:N Appointment
Doctor 1:N TreatmentRecord
Doctor 1:N Prescription
Doctor 1:N DoctorService
Doctor N:N Patient (via authorizedPatients)

Treatment 1:N DoctorService

ChatRoom 1:N ChatMessage

Lead 1:1 Patient (if converted)
```

---

## Data Flow Examples

### Booking Flow

1. Patient selects service → checks `treatments` + doctors' `services`
2. Patient selects doctor → shows doctors who provide the service
3. Patient selects date/time → checks `appointments` for availability
4. Payment → creates appointment in both locations
5. Doctor approves → updates status, adds to `authorizedPatients`

### Doctor Service Configuration

1. Admin adds treatment to `treatments` collection
2. Doctor enables treatment in `/doctors/{doctorId}/services/{treatmentId}`
3. Sets custom price
4. Patients see available services when booking

---

**Last Updated**: December 2024
