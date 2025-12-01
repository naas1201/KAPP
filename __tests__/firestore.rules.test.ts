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
