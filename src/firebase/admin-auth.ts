import { 
  Auth, 
  signInWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';
import { 
  Firestore, 
  doc, 
  getDoc 
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

    // 2. Wait for Firestore to fetch the user profile using the UID
    // We use user.uid because your security rules require isOwner(userId)
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // 3. Check if the document exists
    if (!userDocSnap.exists()) {
      await signOut(auth); // Log them out immediately if no profile exists
      return { 
        success: false, 
        message: 'No user profile found. Please contact support.' 
      };
    }

    // 4. Check the Role
    const userData = userDocSnap.data();
    if (userData?.role !== requiredRole) {
      await signOut(auth); // Log them out if they don't have the required role
      
      // Provide helpful error messages based on actual role
      let message = `Access Denied: You do not have ${requiredRole} privileges.`;
      if (userData?.role === 'admin') {
        message = 'This account is an admin account. Please use the admin login page.';
      } else if (userData?.role === 'doctor') {
        message = 'This account is a doctor account. Please use the doctor login page.';
      } else if (userData?.role === 'patient' || !userData?.role) {
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
    const firebaseError = error as { code?: string; message?: string };
    console.error("Staff Login Error:", error);
    
    // Return a clean error message
    let errorMessage = 'An unexpected error occurred.';
    if (firebaseError.code === 'auth/user-not-found') errorMessage = 'No staff account found with this email.';
    if (firebaseError.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
    if (firebaseError.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';
    if (firebaseError.code === 'auth/invalid-credential') errorMessage = 'Invalid credentials. Please check your email and password.';
    if (firebaseError.code === 'auth/too-many-requests') errorMessage = 'Too many failed attempts. Please try again later.';
    if (firebaseError.code === 'auth/network-request-failed') errorMessage = 'Network error. Please check your internet connection.';
    if (firebaseError.code === 'permission-denied') errorMessage = 'Database permission denied. Check your rules.';

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
