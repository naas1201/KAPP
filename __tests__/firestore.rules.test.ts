/**
 * Firestore Security Rules Tests
 * 
 * Tests role-based access control for Firebase Auth + Firestore.
 * 
 * Prerequisites:
 * - Firebase emulator must be running: firebase emulators:start --only firestore
 * - Run tests with: npm run test:rules
 * 
 * These tests verify:
 * 1. A signed-in admin can read/write staffCredentials
 * 2. A signed-in doctor can access their patients but not others
 * 3. A signed-in patient can only access their own document
 * 4. An unauthenticated user cannot access protected collections
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  deleteDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-firestore-rules-test';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

// Test user IDs (simulating Auth UIDs)
const ADMIN_UID = 'admin-user-uid';
const DOCTOR_UID = 'doctor-user-uid';
const PATIENT_UID = 'patient-user-uid';
const OTHER_PATIENT_UID = 'other-patient-uid';
const UNAUTHENTICATED_UID = null;

// Test emails
const ADMIN_EMAIL = 'admin@test.com';
const DOCTOR_EMAIL = 'doctor@test.com';
const PATIENT_EMAIL = 'patient@test.com';

let testEnv: RulesTestEnvironment;

/**
 * Get the Firestore rules from the project root
 */
function getFirestoreRules(): string {
  const rulesPath = resolve(__dirname, '../firestore.rules');
  return readFileSync(rulesPath, 'utf-8');
}

/**
 * Initialize the test environment before all tests
 */
beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: FIRESTORE_HOST.split(':')[0],
      port: parseInt(FIRESTORE_HOST.split(':')[1] || '8080', 10),
      rules: getFirestoreRules(),
    },
  });
});

/**
 * Clear Firestore data after each test
 */
afterEach(async () => {
  await testEnv.clearFirestore();
});

/**
 * Clean up after all tests
 */
afterAll(async () => {
  await testEnv.cleanup();
});

/**
 * Helper to seed user documents in Firestore
 */
async function seedUserDocuments() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    
    // Seed admin user document at users/{uid}
    await setDoc(doc(db, 'users', ADMIN_UID), {
      email: ADMIN_EMAIL,
      role: 'admin',
      name: 'Test Admin',
    });
    
    // Seed doctor user document at users/{uid}
    await setDoc(doc(db, 'users', DOCTOR_UID), {
      email: DOCTOR_EMAIL,
      role: 'doctor',
      name: 'Test Doctor',
    });
    
    // Seed patient user document at users/{uid}
    await setDoc(doc(db, 'users', PATIENT_UID), {
      email: PATIENT_EMAIL,
      role: 'patient',
      name: 'Test Patient',
    });
    
    // Seed another patient for access control tests
    await setDoc(doc(db, 'users', OTHER_PATIENT_UID), {
      email: 'other@test.com',
      role: 'patient',
      name: 'Other Patient',
    });
  });
}

/**
 * Helper to seed doctor-patient authorization
 */
async function seedDoctorPatientAuthorization(doctorUid: string, patientUid: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    
    // Create the authorized patients subcollection for the doctor
    await setDoc(doc(db, `doctors/${doctorUid}/authorizedPatients`, patientUid), {
      authorizedAt: new Date().toISOString(),
    });
    
    // Create the patient document
    await setDoc(doc(db, 'patients', patientUid), {
      firstName: 'Test',
      lastName: 'Patient',
      email: PATIENT_EMAIL,
    });
  });
}

/**
 * Helper to seed staff credentials
 */
async function seedStaffCredentials() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    
    await setDoc(doc(db, 'staffCredentials', 'doctor-cred-1'), {
      email: DOCTOR_EMAIL,
      role: 'doctor',
    });
  });
}

// =============================================================================
// Test Suite: Unauthenticated Access
// =============================================================================
describe('Unauthenticated User Access', () => {
  beforeEach(async () => {
    await seedUserDocuments();
  });

  test('cannot read users collection', async () => {
    const unauthContext = testEnv.unauthenticatedContext();
    const db = unauthContext.firestore();
    
    await assertFails(getDoc(doc(db, 'users', ADMIN_UID)));
  });

  test('cannot read patients collection', async () => {
    const unauthContext = testEnv.unauthenticatedContext();
    const db = unauthContext.firestore();
    
    await assertFails(getDoc(doc(db, 'patients', PATIENT_UID)));
  });

  test('cannot read doctors collection', async () => {
    const unauthContext = testEnv.unauthenticatedContext();
    const db = unauthContext.firestore();
    
    await assertFails(getDoc(doc(db, 'doctors', DOCTOR_UID)));
  });

  test('can read staffCredentials (public for login verification)', async () => {
    await seedStaffCredentials();
    
    const unauthContext = testEnv.unauthenticatedContext();
    const db = unauthContext.firestore();
    
    // staffCredentials should be publicly readable for login verification
    await assertSucceeds(getDoc(doc(db, 'staffCredentials', 'doctor-cred-1')));
  });

  test('cannot write to staffCredentials', async () => {
    const unauthContext = testEnv.unauthenticatedContext();
    const db = unauthContext.firestore();
    
    await assertFails(setDoc(doc(db, 'staffCredentials', 'new-cred'), {
      email: 'hacker@test.com',
      role: 'admin',
    }));
  });
});

// =============================================================================
// Test Suite: Admin Access
// =============================================================================
describe('Admin User Access', () => {
  beforeEach(async () => {
    await seedUserDocuments();
    await seedStaffCredentials();
  });

  test('can read their own user document', async () => {
    const adminContext = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
    });
    const db = adminContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, 'users', ADMIN_UID)));
  });

  test('can read any user document (admin privilege)', async () => {
    const adminContext = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
    });
    const db = adminContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, 'users', PATIENT_UID)));
    await assertSucceeds(getDoc(doc(db, 'users', DOCTOR_UID)));
  });

  test('can read staffCredentials', async () => {
    const adminContext = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
    });
    const db = adminContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, 'staffCredentials', 'doctor-cred-1')));
  });

  test('can write to staffCredentials', async () => {
    const adminContext = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
    });
    const db = adminContext.firestore();
    
    await assertSucceeds(setDoc(doc(db, 'staffCredentials', 'new-doctor'), {
      email: 'newdoctor@test.com',
      role: 'doctor',
    }));
  });

  test('can update user roles', async () => {
    const adminContext = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
    });
    const db = adminContext.firestore();
    
    // Admin can promote a patient to doctor
    await assertSucceeds(setDoc(doc(db, 'users', PATIENT_UID), {
      email: PATIENT_EMAIL,
      role: 'doctor',
      name: 'Promoted Doctor',
    }));
  });

  test('can delete user documents', async () => {
    const adminContext = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
    });
    const db = adminContext.firestore();
    
    await assertSucceeds(deleteDoc(doc(db, 'users', OTHER_PATIENT_UID)));
  });
});

// =============================================================================
// Test Suite: Doctor Access
// =============================================================================
describe('Doctor User Access', () => {
  beforeEach(async () => {
    await seedUserDocuments();
    await seedDoctorPatientAuthorization(DOCTOR_UID, PATIENT_UID);
  });

  test('can read their own user document', async () => {
    const doctorContext = testEnv.authenticatedContext(DOCTOR_UID, {
      email: DOCTOR_EMAIL,
    });
    const db = doctorContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, 'users', DOCTOR_UID)));
  });

  test('cannot read other user documents (no admin privilege)', async () => {
    const doctorContext = testEnv.authenticatedContext(DOCTOR_UID, {
      email: DOCTOR_EMAIL,
    });
    const db = doctorContext.firestore();
    
    await assertFails(getDoc(doc(db, 'users', PATIENT_UID)));
    await assertFails(getDoc(doc(db, 'users', ADMIN_UID)));
  });

  test('can read authorized patient data', async () => {
    const doctorContext = testEnv.authenticatedContext(DOCTOR_UID, {
      email: DOCTOR_EMAIL,
    });
    const db = doctorContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, 'patients', PATIENT_UID)));
  });

  test('cannot read unauthorized patient data', async () => {
    const doctorContext = testEnv.authenticatedContext(DOCTOR_UID, {
      email: DOCTOR_EMAIL,
    });
    const db = doctorContext.firestore();
    
    // Doctor is not authorized for OTHER_PATIENT_UID
    await assertFails(getDoc(doc(db, 'patients', OTHER_PATIENT_UID)));
  });

  test('cannot write to staffCredentials', async () => {
    const doctorContext = testEnv.authenticatedContext(DOCTOR_UID, {
      email: DOCTOR_EMAIL,
    });
    const db = doctorContext.firestore();
    
    await assertFails(setDoc(doc(db, 'staffCredentials', 'hacked'), {
      email: 'hacker@test.com',
      role: 'admin',
    }));
  });

  test('cannot update user roles', async () => {
    const doctorContext = testEnv.authenticatedContext(DOCTOR_UID, {
      email: DOCTOR_EMAIL,
    });
    const db = doctorContext.firestore();
    
    await assertFails(setDoc(doc(db, 'users', PATIENT_UID), {
      email: PATIENT_EMAIL,
      role: 'admin', // Try to escalate privileges
    }));
  });
});

// =============================================================================
// Test Suite: Patient Access
// =============================================================================
describe('Patient User Access', () => {
  beforeEach(async () => {
    await seedUserDocuments();
  });

  test('can read their own user document', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, 'users', PATIENT_UID)));
  });

  test('cannot read other user documents', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertFails(getDoc(doc(db, 'users', OTHER_PATIENT_UID)));
    await assertFails(getDoc(doc(db, 'users', DOCTOR_UID)));
    await assertFails(getDoc(doc(db, 'users', ADMIN_UID)));
  });

  test('can read their own patient document', async () => {
    // Seed patient document
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'patients', PATIENT_UID), {
        firstName: 'Test',
        lastName: 'Patient',
        email: PATIENT_EMAIL,
      });
    });
    
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, 'patients', PATIENT_UID)));
  });

  test('cannot read other patient documents', async () => {
    // Seed other patient document
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'patients', OTHER_PATIENT_UID), {
        firstName: 'Other',
        lastName: 'Patient',
        email: 'other@test.com',
      });
    });
    
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertFails(getDoc(doc(db, 'patients', OTHER_PATIENT_UID)));
  });

  test('cannot write to staffCredentials', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertFails(setDoc(doc(db, 'staffCredentials', 'hacked'), {
      email: 'hacker@test.com',
      role: 'admin',
    }));
  });

  test('cannot update their own role', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Patient cannot promote themselves
    await assertFails(setDoc(doc(db, 'users', PATIENT_UID), {
      email: PATIENT_EMAIL,
      role: 'admin', // Try to escalate
    }));
  });
});

// =============================================================================
// Test Suite: User Document Creation (Sign-up)
// =============================================================================
describe('User Document Creation (Sign-up)', () => {
  test('new user can create their own document with patient role', async () => {
    const newUserUid = 'new-user-uid';
    const newUserEmail = 'newuser@test.com';
    
    const newUserContext = testEnv.authenticatedContext(newUserUid, {
      email: newUserEmail,
    });
    const db = newUserContext.firestore();
    
    await assertSucceeds(setDoc(doc(db, 'users', newUserUid), {
      email: newUserEmail,
      role: 'patient', // Default role for sign-ups
    }));
  });

  test('new user cannot create document with admin role', async () => {
    const newUserUid = 'new-user-uid';
    const newUserEmail = 'newuser@test.com';
    
    const newUserContext = testEnv.authenticatedContext(newUserUid, {
      email: newUserEmail,
    });
    const db = newUserContext.firestore();
    
    // Users cannot self-assign admin role during sign-up
    await assertFails(setDoc(doc(db, 'users', newUserUid), {
      email: newUserEmail,
      role: 'admin',
    }));
  });

  test('new user cannot create document with doctor role', async () => {
    const newUserUid = 'new-user-uid';
    const newUserEmail = 'newuser@test.com';
    
    const newUserContext = testEnv.authenticatedContext(newUserUid, {
      email: newUserEmail,
    });
    const db = newUserContext.firestore();
    
    // Users cannot self-assign doctor role during sign-up
    await assertFails(setDoc(doc(db, 'users', newUserUid), {
      email: newUserEmail,
      role: 'doctor',
    }));
  });

  test('new user cannot create document for another user', async () => {
    const newUserUid = 'new-user-uid';
    const newUserEmail = 'newuser@test.com';
    const otherUid = 'other-uid';
    
    const newUserContext = testEnv.authenticatedContext(newUserUid, {
      email: newUserEmail,
    });
    const db = newUserContext.firestore();
    
    // Users cannot create documents for other UIDs
    await assertFails(setDoc(doc(db, 'users', otherUid), {
      email: newUserEmail,
      role: 'patient',
    }));
  });

  test('new user must use matching email', async () => {
    const newUserUid = 'new-user-uid';
    const newUserEmail = 'newuser@test.com';
    
    const newUserContext = testEnv.authenticatedContext(newUserUid, {
      email: newUserEmail,
    });
    const db = newUserContext.firestore();
    
    // Email in document must match auth token email
    await assertFails(setDoc(doc(db, 'users', newUserUid), {
      email: 'different@test.com', // Mismatched email
      role: 'patient',
    }));
  });
});

// =============================================================================
// Test Suite: Patient Appointment Operations
// =============================================================================
describe('Patient Appointment Operations', () => {
  beforeEach(async () => {
    await seedUserDocuments();
  });

  test('patient can create their own appointment with valid data', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Create appointment in patient's appointments subcollection
    await assertSucceeds(setDoc(doc(db, `patients/${PATIENT_UID}/appointments`, 'apt-1'), {
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: 'I have a headache',
      phoneNumber: '09123456789',
    }));
  });

  test('patient can create appointment with empty patientNotes', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Create appointment with empty notes (should pass noScriptTags validation)
    await assertSucceeds(setDoc(doc(db, `patients/${PATIENT_UID}/appointments`, 'apt-2'), {
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: '',
      phoneNumber: '09123456789',
    }));
  });

  test('patient can read their own appointment', async () => {
    // First create the appointment with security rules disabled
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, `patients/${PATIENT_UID}/appointments`, 'apt-3'), {
        patientId: PATIENT_UID,
        doctorId: DOCTOR_UID,
        serviceType: 'Follow-up',
        dateTime: new Date().toISOString(),
        status: 'confirmed',
        patientNotes: '',
      });
    });
    
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, `patients/${PATIENT_UID}/appointments`, 'apt-3')));
  });

  test('patient cannot create appointment in another patient subcollection', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Try to create appointment under OTHER_PATIENT_UID's subcollection
    await assertFails(setDoc(doc(db, `patients/${OTHER_PATIENT_UID}/appointments`, 'apt-4'), {
      patientId: PATIENT_UID, // Even with own patientId in data
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: '',
    }));
  });

  test('patient cannot read another patient appointment', async () => {
    // Create appointment for other patient
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, `patients/${OTHER_PATIENT_UID}/appointments`, 'apt-5'), {
        patientId: OTHER_PATIENT_UID,
        doctorId: DOCTOR_UID,
        serviceType: 'Checkup',
        dateTime: new Date().toISOString(),
        status: 'pending',
        patientNotes: '',
      });
    });
    
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertFails(getDoc(doc(db, `patients/${OTHER_PATIENT_UID}/appointments`, 'apt-5')));
  });

  test('patient appointment rejects script injection in patientNotes', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Try to inject script tag - should fail noScriptTags validation
    await assertFails(setDoc(doc(db, `patients/${PATIENT_UID}/appointments`, 'apt-6'), {
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: '<script>alert("xss")</script>',
    }));
  });

  test('patient appointment rejects javascript: in patientNotes', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertFails(setDoc(doc(db, `patients/${PATIENT_UID}/appointments`, 'apt-7'), {
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: 'javascript:alert(1)',
    }));
  });

  test('patient appointment rejects event handlers in patientNotes', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    await assertFails(setDoc(doc(db, `patients/${PATIENT_UID}/appointments`, 'apt-8'), {
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: '<img onerror=alert(1)>',
    }));
  });

  test('patient appointment allows valid medical text with words like condition', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Text containing words like "condition" should be allowed
    // This was previously blocked by the overly broad event handler regex
    await assertSucceeds(setDoc(doc(db, `patients/${PATIENT_UID}/appointments`, 'apt-9'), {
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: 'My condition = chronic headaches. I have a question = is this normal?',
    }));
  });
});

// =============================================================================
// Test Suite: Top-Level Appointments Collection
// =============================================================================
describe('Top-Level Appointments Collection', () => {
  beforeEach(async () => {
    await seedUserDocuments();
  });

  test('patient can create appointment in top-level collection', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Patient can create in top-level appointments with their patientId
    await assertSucceeds(setDoc(doc(db, 'appointments', 'top-apt-1'), {
      patientId: PATIENT_UID, // Must match auth.uid
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: 'Test notes',
    }));
  });

  test('patient cannot create appointment with mismatched patientId', async () => {
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Try to create with different patientId - should fail
    await assertFails(setDoc(doc(db, 'appointments', 'top-apt-2'), {
      patientId: OTHER_PATIENT_UID, // Doesn't match auth.uid
      doctorId: DOCTOR_UID,
      serviceType: 'General Consultation',
      dateTime: new Date().toISOString(),
      status: 'pending',
      patientNotes: '',
    }));
  });

  test('patient cannot read from top-level appointments', async () => {
    // Create appointment first
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'appointments', 'top-apt-3'), {
        patientId: PATIENT_UID,
        doctorId: DOCTOR_UID,
        serviceType: 'Checkup',
        status: 'pending',
      });
    });
    
    const patientContext = testEnv.authenticatedContext(PATIENT_UID, {
      email: PATIENT_EMAIL,
    });
    const db = patientContext.firestore();
    
    // Patients cannot read from top-level appointments (only doctors/admins)
    await assertFails(getDoc(doc(db, 'appointments', 'top-apt-3')));
  });

  test('doctor can read from top-level appointments', async () => {
    // Create appointment first
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'appointments', 'top-apt-4'), {
        patientId: PATIENT_UID,
        doctorId: DOCTOR_UID,
        serviceType: 'Checkup',
        status: 'pending',
      });
    });
    
    const doctorContext = testEnv.authenticatedContext(DOCTOR_UID, {
      email: DOCTOR_EMAIL,
    });
    const db = doctorContext.firestore();
    
    await assertSucceeds(getDoc(doc(db, 'appointments', 'top-apt-4')));
  });

  test('doctor can update appointments in top-level collection', async () => {
    // Create appointment first
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'appointments', 'top-apt-5'), {
        patientId: PATIENT_UID,
        doctorId: DOCTOR_UID,
        serviceType: 'Checkup',
        status: 'pending',
      });
    });
    
    const doctorContext = testEnv.authenticatedContext(DOCTOR_UID, {
      email: DOCTOR_EMAIL,
    });
    const db = doctorContext.firestore();
    
    // Doctor can approve/reject appointments
    await assertSucceeds(setDoc(doc(db, 'appointments', 'top-apt-5'), {
      patientId: PATIENT_UID,
      doctorId: DOCTOR_UID,
      serviceType: 'Checkup',
      status: 'confirmed',
    }));
  });
});
