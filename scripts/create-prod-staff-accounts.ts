/**
 * Production Staff Account Seeding Script
 * 
 * Creates admin@lpp.ovh and doctor@lpp.ovh accounts in Firebase Auth
 * and Firestore with the password "1q2w3e4r5t6y" and appropriate roles.
 * 
 * WARNING: These accounts are insecure in production and must be rotated 
 * or removed before publishing to general users.
 * 
 * Usage:
 *   - With emulator: 
 *     export FIRESTORE_EMULATOR_HOST=localhost:8080 AUTH_EMULATOR_HOST=localhost:9099
 *     npm run seed:prod-staff-accounts
 *   - With production (requires explicit flag):
 *     export FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccount.json
 *     export PROCEED_WITH_HARD_CODED_PROD_ACCOUNTS=1
 *     NODE_ENV=production npm run seed:prod-staff-accounts
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Safety guard for production
const isProd = process.env.NODE_ENV === 'production';
if (isProd && process.env.PROCEED_WITH_HARD_CODED_PROD_ACCOUNTS !== '1') {
  console.error(
    'ERROR: Refusing to run in production without PROCEED_WITH_HARD_CODED_PROD_ACCOUNTS=1\n' +
    'This script creates accounts with hard-coded passwords which is a security risk.\n' +
    'Set PROCEED_WITH_HARD_CODED_PROD_ACCOUNTS=1 to proceed anyway.'
  );
  process.exit(2);
}

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  try {
    const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized with service account from:', saPath);
  } catch (error) {
    console.error('Failed to read service account file:', saPath);
    console.error(error);
    process.exit(1);
  }
} else if (process.env.FIRESTORE_EMULATOR_HOST || process.env.AUTH_EMULATOR_HOST) {
  // Running against emulator - use default app initialization
  admin.initializeApp();
  console.log('Firebase Admin SDK initialized for emulator mode');
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('  FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
  }
  if (process.env.AUTH_EMULATOR_HOST) {
    console.log('  AUTH_EMULATOR_HOST:', process.env.AUTH_EMULATOR_HOST);
  }
} else {
  console.error(
    'ERROR: Provide FIREBASE_SERVICE_ACCOUNT env var pointing to your service account JSON file,\n' +
    'or run against emulator by setting FIRESTORE_EMULATOR_HOST and AUTH_EMULATOR_HOST.\n\n' +
    'Example for emulator:\n' +
    '  export FIRESTORE_EMULATOR_HOST=localhost:8080\n' +
    '  export AUTH_EMULATOR_HOST=localhost:9099\n' +
    '  npm run seed:prod-staff-accounts\n\n' +
    'Example for production:\n' +
    '  export FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccount.json\n' +
    '  export PROCEED_WITH_HARD_CODED_PROD_ACCOUNTS=1\n' +
    '  NODE_ENV=production npm run seed:prod-staff-accounts'
  );
  process.exit(1);
}

const db = admin.firestore();

async function upsertAccount(
  email: string, 
  password: string, 
  role: 'admin' | 'doctor', 
  staffId: string
): Promise<string> {
  const normalizedEmail = email.toLowerCase();
  
  let userRecord: admin.auth.UserRecord;
  
  try {
    // Try to get existing user by email
    userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    console.log(`Found existing user: ${normalizedEmail} (uid=${userRecord.uid})`);
    
    // Update password for existing user
    userRecord = await admin.auth().updateUser(userRecord.uid, { password });
    console.log(`Updated password for: ${normalizedEmail}`);
  } catch (e: unknown) {
    const error = e as { code?: string };
    if (error.code === 'auth/user-not-found') {
      // Create new user
      userRecord = await admin.auth().createUser({ 
        email: normalizedEmail, 
        password,
        emailVerified: true 
      });
      console.log(`Created new user: ${normalizedEmail} (uid=${userRecord.uid})`);
    } else {
      throw e;
    }
  }

  // Set custom claims for role
  await admin.auth().setCustomUserClaims(userRecord.uid, { role });
  console.log(`Set custom claims for ${normalizedEmail}: { role: '${role}' }`);

  // Upsert Firestore user doc at users/{uid}
  const userDocRef = db.collection('users').doc(userRecord.uid);
  await userDocRef.set({
    email: normalizedEmail,
    emailLower: normalizedEmail,
    role,
    staffId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`Upserted Firestore doc at users/${userRecord.uid}`);

  return userRecord.uid;
}

async function main() {
  console.log('\n========================================');
  console.log('Creating Production Staff Accounts');
  console.log('========================================\n');
  
  if (isProd) {
    console.log('⚠️  WARNING: Running in PRODUCTION mode!');
    console.log('⚠️  These accounts have hard-coded passwords and are INSECURE.');
    console.log('⚠️  Remove or change these accounts before publishing to general users.\n');
  }

  try {
    const adminUid = await upsertAccount('admin@lpp.ovh', '1q2w3e4r5t6y', 'admin', 'admin1');
    console.log('');
    
    const doctorUid = await upsertAccount('doctor@lpp.ovh', '1q2w3e4r5t6y', 'doctor', 'doc1');
    console.log('');
    
    console.log('========================================');
    console.log('DONE');
    console.log('========================================');
    console.log('Admin UID:', adminUid);
    console.log('Doctor UID:', doctorUid);
    console.log('');
    console.log('DEV/PRODUCTION accounts created: remove/change these before publishing to general users.');
    console.log('');
    console.log('Login with:');
    console.log('  Admin:  admin@lpp.ovh  / 1q2w3e4r5t6y at /admin/login');
    console.log('  Doctor: doctor@lpp.ovh / 1q2w3e4r5t6y at /doctor/login');
  } catch (err) {
    console.error('Error seeding accounts:', err);
    process.exit(1);
  }
}

main();
