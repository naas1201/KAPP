import { 
  Auth, 
  signInWithEmailAndPassword, 
  signOut,
  User,
  AuthError
} from 'firebase/auth';
import { 
  Firestore, 
  doc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  FirestoreError
} from 'firebase/firestore';

// Supported staff roles
export type StaffRole = 'admin' | 'doctor';

// Define a response type for clarity
export interface StaffLoginResult {
  success: boolean;
  message?: string;
  user?: User;
}

/**
 * Type guard to check if an error is a Firebase AuthError
 */
function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as AuthError).code === 'string'
  );
}

/**
 * Type guard to check if an error is a Firestore error
 */
function isFirestoreError(error: unknown): error is FirestoreError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as FirestoreError).code === 'string'
  );
}

/**
 * Finds a user document using multiple strategies to handle different document schemes.
 * Tries: 1) by UID, 2) by email field query, 3) by emailLower field query
 */
async function findUserDocument(
  db: Firestore,
  uid: string,
  email: string | null
): Promise<{ exists: boolean; userData?: Record<string, unknown> }> {
  // Strategy 1: Try to find by UID (primary strategy)
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return { exists: true, userData: userDocSnap.data() };
  }

  // If no email is provided, we can't try alternative strategies
  if (!email) {
    return { exists: false };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Strategy 2: Query by email field
  const emailQuery = query(
    collection(db, 'users'),
    where('email', '==', normalizedEmail)
  );
  const emailSnap = await getDocs(emailQuery);
  if (!emailSnap.empty) {
    return { exists: true, userData: emailSnap.docs[0].data() };
  }

  // Strategy 3: Query by emailLower field
  const emailLowerQuery = query(
    collection(db, 'users'),
    where('emailLower', '==', normalizedEmail)
  );
  const emailLowerSnap = await getDocs(emailLowerQuery);
  if (!emailLowerSnap.empty) {
    return { exists: true, userData: emailLowerSnap.docs[0].data() };
  }

  return { exists: false };
}

/**
 * Looks up a staff member's email by their staff ID.
 * 
 * @param db - The Firebase Firestore instance
 * @param staffId - The staff ID to look up
 * @param role - The required role
 */
export async function lookupEmailByStaffId(
  db: Firestore,
  staffId: string,
  role: StaffRole
): Promise<string | null> {
  // Validate staffId input
  if (!staffId || typeof staffId !== 'string') {
    return null;
  }
  
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('staffId', '==', staffId.toLowerCase()),
      where('role', '==', role)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data().email || null;
    }
    
    return null;
  } catch (error) {
    console.error('[StaffAuth] Error looking up staff ID:', error);
    return null;
  }
}

/**
 * Attempts to sign in a staff user and verifies if they have the required role.
 * This is a BLOCKING function (it waits for the result).
 * 
 * @param auth - The Firebase Auth instance
 * @param db - The Firebase Firestore instance
 * @param email - The staff email
 * @param password - The staff password
 * @param requiredRole - The required role ('admin' or 'doctor')
 */
export async function signInStaffUser(
  auth: Auth, 
  db: Firestore, 
  email: string, 
  password: string,
  requiredRole: StaffRole
): Promise<StaffLoginResult> {
  
  try {
    // 1. Wait for Firebase Auth to confirm credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Wait for Firestore to fetch the user profile
    // Try multiple strategies to handle different document schemes
    const userDoc = await findUserDocument(db, user.uid, user.email);

    // 3. Check if the document exists
    if (!userDoc.exists || !userDoc.userData) {
      await signOut(auth); // Log them out immediately if no profile exists
      return { 
        success: false, 
        message: 'No user profile found. Please contact support.' 
      };
    }

    // 4. Check the Role
    const userData = userDoc.userData;
    if (userData.role !== requiredRole) {
      await signOut(auth); // Log them out if they don't have the required role
      
      // Provide helpful error messages based on actual role
      let message = `Access Denied: You do not have ${requiredRole} privileges.`;
      if (userData.role === 'admin') {
        message = 'This account is an admin account. Please use the admin login page.';
      } else if (userData.role === 'doctor') {
        message = 'This account is a doctor account. Please use the doctor login page.';
      } else if (userData.role === 'patient' || !userData.role) {
        message = 'This is a patient account. Please use the Patient Login page.';
      }
      
      return { 
        success: false, 
        message 
      };
    }

    // 5. Success
    return { 
      success: true, 
      user: user 
    };

  } catch (error: unknown) {
    console.error("Staff Login Error:", error);
    
    // Return a clean error message based on error type
    let errorMessage = 'An unexpected error occurred.';
    
    if (isAuthError(error)) {
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No staff account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
      }
    } else if (isFirestoreError(error) && error.code === 'permission-denied') {
      errorMessage = 'Database permission denied. Check your rules.';
    }

    return { 
      success: false, 
      message: errorMessage 
    };
  }
}

/**
 * Attempts to sign in a user and verifies if they have the 'admin' role.
 * This is a BLOCKING function (it waits for the result).
 * 
 * @param auth - The Firebase Auth instance
 * @param db - The Firebase Firestore instance
 * @param email - The staff email
 * @param password - The staff password
 */
export async function signInAdminUser(
  auth: Auth, 
  db: Firestore, 
  email: string, 
  password: string
): Promise<StaffLoginResult> {
  return signInStaffUser(auth, db, email, password, 'admin');
}

/**
 * Attempts to sign in a user and verifies if they have the 'doctor' role.
 * This is a BLOCKING function (it waits for the result).
 * 
 * @param auth - The Firebase Auth instance
 * @param db - The Firebase Firestore instance
 * @param email - The staff email
 * @param password - The staff password
 */
export async function signInDoctorUser(
  auth: Auth, 
  db: Firestore, 
  email: string, 
  password: string
): Promise<StaffLoginResult> {
  return signInStaffUser(auth, db, email, password, 'doctor');
}
