# E2E Testing Guide

## Overview

This project includes Playwright e2e tests that validate the booking → approve workflow and core doctor dashboard functionality. Tests run against the **Firestore + Auth emulator** for isolated, repeatable testing.

## Setup

### Prerequisites

- Node.js 18+
- `pnpm` package manager

### Installation

```bash
pnpm install
npx playwright install --with-deps
```

### Start the Firebase Emulator

In one terminal, start the Firestore + Auth emulator:

```bash
./node_modules/.bin/firebase emulators:start --only firestore,auth --project demo-project
```

The emulator UI is available at `http://127.0.0.1:4000/` (optional).

### Run Tests

In another terminal, run the full e2e suite:

```bash
# Quick smoke test only (default)
pnpm -s test:e2e

# Full booking → approve workflow
RUN_FULL_E2E=1 DOCTOR_EMAIL=info@lpp.ovh DOCTOR_PASS=1q2w3e4r5t6y pnpm -s test:e2e
```

## Test Structure

### Smoke Test (`e2e/tests/smoke.spec.ts`)

- Validates that the doctor dashboard renders the "Consultation Requests" UI section.
- Logs in with provided doctor credentials.
- Requires: `DOCTOR_EMAIL` and `DOCTOR_PASS` env vars.

### Full Booking → Approve Workflow (`e2e/tests/booking-and-approve.spec.ts`)

- Runs only when `RUN_FULL_E2E=1`.
- Validates the complete booking and approval flow:
  1. Seeder creates test doctor, patient, and pending appointment in the emulator.
  2. Doctor logs in and views consultation requests.
  3. Doctor approves the request; UI reflects the change.

## Data Seeding

The `globalSetup` hook (`e2e/global-setup.ts`) automatically seeds test data:

- **Doctor**: email `info@lpp.ovh`, role `doctor` in Firestore.
- **Patient**: email `patient@example.test` in Firestore.
- **Appointment**: pending appointment under `patients/{patientId}/appointments/` and top-level `appointments/` collection.
- **Auth Users**: attempts to create auth users in the Auth emulator (non-fatal if they already exist).

Seeded data is torn down after tests complete (`e2e/global-teardown.ts`).

## Firebase Client Emulator Connection

The Next.js app automatically connects to the local emulator when run with the appropriate env vars:

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
pnpm dev
```

The `src/firebase/client.ts` checks for these env vars and calls `connectFirestoreEmulator()` / `connectAuthEmulator()` automatically.

## Test IDs for Stable Selectors

Key interactive elements have `data-testid` attributes for robust Playwright selectors:

### Booking Flow
- `booking-date`: date picker button
- `booking-time-*`: time slot buttons (e.g., `booking-time-0900am`)
- `booking-fullname`, `booking-email`, `booking-phone`: guest inputs
- `booking-submit`: submit button

### Doctor Dashboard
- `consultation-requests-table`: table body
- `consultation-approve-<appointmentId>`: approve button
- `consultation-reject-<appointmentId>`: reject button
- `consultation-view-<appointmentId>`: view patient button

### Doctor My Services
- `service-toggle-<treatmentId>`: service checkbox
- `service-price-<treatmentId>`: price input

## Troubleshooting

### Emulator Not Starting
- Ensure `firebase.json` and `.firebaserc` are present in the repo root.
- Check that port `8080` (Firestore) and `9099` (Auth) are not in use.
- Install firebase-tools: `pnpm add -D firebase-tools` (if missing).

### Test Timeout
- Verify the emulator is running: check `http://127.0.0.1:4000/firestore`.
- Increase timeouts in test (currently 10000ms for login, 5000ms for other assertions).
- Check Playwright browser logs in `test-results/` directory.

### Auth Issues
- The Auth emulator starts fresh each run; create test users via the seeder.
- If users already exist in the emulator, the seeder gracefully skips them.
- Ensure `DOCTOR_EMAIL` and `DOCTOR_PASS` match the credentials in the emulator.

## CI Integration

Add to your CI pipeline:

```bash
# Start emulator (background)
./node_modules/.bin/firebase emulators:start --only firestore,auth &
sleep 10  # wait for startup

# Run tests
RUN_FULL_E2E=1 DOCTOR_EMAIL=info@lpp.ovh DOCTOR_PASS=1q2w3e4r5t6y pnpm -s test:e2e

# Tests will auto-teardown and exit
```

## Related Files

- `playwright.config.ts`: Playwright configuration (baseURL, global setup/teardown).
- `e2e/global-setup.ts`: Seeder entry point.
- `e2e/global-teardown.ts`: Teardown entry point.
- `e2e/utils/firestore-emulator.ts`: Firestore seeding utilities.
- `src/firebase/client.ts`: Firebase SDK initialization with emulator detection.

