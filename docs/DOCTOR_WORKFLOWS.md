# Doctor Functionalities Guide

This document outlines all the functionalities and workflows available to doctors in the KAPP medical clinic application.

## Table of Contents

1. [Doctor Dashboard](#doctor-dashboard)
2. [Appointment Management](#appointment-management)
3. [My Services](#my-services)
4. [Patient Management](#patient-management)
5. [Doctor Profile](#doctor-profile)
6. [Gamification](#gamification)
7. [Firebase Data Structure](#firebase-data-structure)

---

## Doctor Dashboard

The doctor dashboard (`/doctor/dashboard`) is the central hub for managing daily activities.

### Features

#### 1. Performance Statistics
- **Total Appointments**: Count of all appointments handled
- **Unique Patients**: Number of distinct patients seen
- **Services Offered**: Number of services the doctor provides
- **Consultation Hours**: Estimated hours spent in consultations

*Note: Stats are shown after 5+ appointments to gather meaningful data.*

#### 2. Next Up Section
- Displays the next scheduled confirmed appointment
- Shows patient name, service type, and appointment time
- Quick actions: Message patient, View patient details
- Time countdown showing how long until the appointment

#### 3. Today's Schedule
- Lists all confirmed appointments for the current day
- Quick navigation to patient records
- Sorted chronologically

#### 4. Patient Reviews Carousel
- Displays positive reviews (4+ stars) from patients
- Auto-rotating carousel with patient testimonials
- Helps doctors see their impact and stay motivated

#### 5. Consultation Requests
- Lists all pending appointment requests
- **Approve with Notes**: Doctors can approve requests with optional notes for:
  - Patient (visible to the patient)
  - Admin (internal notes only)
- **Reject with Reason**: Doctors can decline with explanations
- Quick view of patient notes submitted during booking

#### 6. Upcoming Appointments
- Complete list of all scheduled appointments
- Status badges (confirmed, pending, etc.)
- Quick actions to view patient details

---

## Appointment Management

### Approval Workflow

1. **Patient books appointment** → Status: `pending`
2. **Doctor reviews request** → Sees patient notes and service details
3. **Doctor approves** → 
   - Status changes to `confirmed`
   - Optional note to patient added
   - Optional note to admin added
   - Patient added to doctor's authorized patients list
   - Gamification data updated
4. **Doctor rejects** →
   - Status changes to `rejected`
   - Reason sent to patient
   - Optional note to admin added

### Notes System

- **Doctor Note to Patient**: Visible in patient's appointment confirmation
  - Example: "Please arrive 15 minutes early for paperwork"
- **Doctor Note to Admin**: Only visible to clinic administrators
  - Example: "Patient needs wheelchair access"

---

## My Services

Located at `/doctor/my-services`, this section allows doctors to manage their service offerings.

### Clinic Services Tab

- Lists all procedures/treatments offered by the clinic
- **Toggle Switch**: Enable/disable services you provide
- **Custom Pricing**: Set your own prices for each service (in ₱)
- Services you enable will be visible to patients during booking
- Alert notification when new clinic procedures are added

### Custom Services Tab

Doctors can create their own unique services:

1. **Add Service**: Create new custom services
   - Service name
   - Category (Aesthetic, General Medicine, Dermatology, etc.)
   - Description
   - Price

2. **Edit Service**: Modify existing custom services

3. **Delete Service**: Remove custom services

### Data Sync

- Services are saved to `doctors/{doctorId}/services`
- Custom services are saved to `doctors/{doctorId}/customServices`
- Patient booking system reads from both collections

---

## Patient Management

### Patient List (`/doctor/patients`)

- Searchable list of all patients
- Patient statistics:
  - Total patients
  - New this month
  - Active this month
- Quick actions:
  - View patient record
  - Send message
  - Call patient
  - New consultation

### Patient Detail Page (`/doctor/patient/[patientId]`)

#### Patient Profile Card
- Basic information (name, age, contact)
- **Workflow Status Selector**: 
  - New Patient
  - Accepted
  - Waiting for Consultation
  - In Consultation
  - Patient Treated
  - Needs Follow-up
  - Completed

#### Quick Actions
- Start Video Call
- Send Message
- Call Patient
- **Export All Data (XML)**: Complete patient record export
- Report Patient

#### Medical Information
- Aesthetic Goals
- Initial Medical History
- Allergies

#### Consultation History
- Timeline of all consultations
- Each record includes:
  - History of Present Illness
  - Past Medical History
  - Family History
  - Personal/Social History
  - Skin Care Routine
  - Diagnosis
  - Treatment Plan
- Export individual records to XML

#### Prescriptions
- List of all prescriptions
- Validity status badges (Valid, Expiring, Expired)
- Controlled substance indicators
- Actions: Edit, Renew, Delete
- Create new prescriptions with:
  - Drug name and generic name
  - Dosage and frequency
  - Duration and quantity
  - Route (oral, topical, injection, etc.)
  - Instructions
  - Validity period
  - Controlled substance flag

### Data Export

**Individual Record Export**:
- XML format compliant with Philippines DOH standards
- Includes all medical details and digital signature

**Complete Patient Export**:
- Exports all patient data including:
  - Demographics
  - All consultations
  - All prescriptions
- XML format for portability and backup

---

## Doctor Profile

Located at `/doctor/profile`, this section manages doctor information.

### Personal Information Tab
- First Name, Last Name
- Display Name / Pseudonym (shown to patients)
- Email Address
- Phone Number
- Address

### Professional Tab
- Specialization (dropdown selection)
- PRC License Number
- Professional Bio

### Workflow Settings Tab
- **Default Patient Status**: Sets initial status for new patients
- Status workflow guide showing all status options:
  - New Patient → Accepted → Waiting for Consultation → In Consultation → Treated → Follow-up → Completed

### Progress Card
- Current level and title
- XP progress bar
- Total consultations count
- Total patients count
- Current streak indicator

---

## Gamification

The app tracks doctor activities to provide a gamified experience.

### Tracked Metrics

| Metric | Description |
|--------|-------------|
| XP | Experience points earned through activities |
| Level | Current level (1-30) based on XP |
| Title | Title corresponding to level (e.g., "Senior Physician") |
| Total Consultations | Number of consultations completed |
| Total Patients | Number of unique patients treated |
| Current Streak | Consecutive days with activity |
| Longest Streak | Best streak achieved |

### Level Progression

Levels 1-10: Basic progression (Resident → Medical Legend)
Levels 11-20: Extended progression (Healthcare Pioneer → Supreme Healer)
Levels 21-30: Elite progression (Platinum Healer → Diamond Physician)

### Achievement Categories

1. **Consultations**: Milestones for completed consultations
2. **Patients**: Milestones for unique patients treated
3. **Streak**: Consecutive days with activity
4. **Special**: Weekend work, early starts, perfect reviews
5. **Holiday**: Working on Philippine holidays

---

## Firebase Data Structure

### Collections

```
/doctors/{doctorId}
├── firstName, lastName, email
├── displayName, phone, specialization
├── licenseNumber, bio, address
├── defaultPatientStatus
├── gamification/
│   ├── xp, level
│   ├── totalConsultations, totalPatients
│   ├── currentStreak, longestStreak
│   └── lastActivityAt
├── /services/{treatmentId}
│   ├── treatmentId
│   ├── providesService (boolean)
│   └── price
├── /customServices/{serviceId}
│   ├── name, description, category
│   ├── price
│   ├── isCustom: true
│   └── createdAt, createdBy
├── /patients/{patientId}
│   ├── status
│   └── statusUpdatedAt
└── /authorizedPatients/{patientId}
    ├── patientId
    └── addedAt

/appointments/{appointmentId}
├── patientId, doctorId
├── serviceType, dateTime
├── status (pending/confirmed/rejected)
├── confirmedAt, confirmedBy
├── rejectedAt, rejectedBy
├── doctorNoteToPatient
├── doctorNoteToAdmin
└── paymentStatus

/treatments/{treatmentId}
├── name
├── description
└── category
```

### Firestore Security Rules

- Doctors can read/write their own profile
- Doctors can manage their own services and custom services
- Doctors can update patient status in their patients subcollection
- Doctors can add authorized patients after approving appointments
- All signed-in users can read doctor profiles and services

---

## Workflow Summary

### Daily Doctor Workflow

1. **Start of Day**
   - Check dashboard for today's appointments
   - Review pending consultation requests
   - Note the "Next Up" patient

2. **Handling Requests**
   - Review patient notes
   - Approve with notes or decline with reason
   - System automatically adds patient to authorized list

3. **During Consultations**
   - Update patient status to "In Consultation"
   - Access patient history and medical records
   - Create consultation records
   - Issue prescriptions if needed

4. **After Consultation**
   - Update status to "Treated" or "Needs Follow-up"
   - Export records if needed
   - Prepare for next patient

5. **End of Day**
   - Review completed appointments
   - Update any pending statuses
   - Check achievements progress

---

## Verification Checklist

- [x] Dashboard shows appointment requests with patient notes
- [x] Approval dialog with notes for patient and admin
- [x] Rejection dialog with reason field
- [x] Services page with toggle switches
- [x] Custom service creation, editing, deletion
- [x] Patient list with search and statistics
- [x] Patient detail page with workflow status
- [x] XML export for individual records
- [x] XML export for complete patient data
- [x] Doctor profile management
- [x] Gamification data collection
- [x] Firebase rules updated for new features
- [x] Next Up section for upcoming appointments
- [x] Today's schedule view

All features interact with Firebase Firestore for real-time data synchronization.
