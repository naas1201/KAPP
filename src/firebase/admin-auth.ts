import { 
  Auth, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  Firestore, 
  doc, 
  getDoc 
} from 'firebase/firestore';

// Define a response type for clarity
interface AdminLoginResult {
  success: boolean;
  message?: string;
  user?: any;
}

/**
 * Attempts to sign in a user and verifies if they have the 'admin' role.
 * This is a BLOCKING function (it waits for the result).
 * * @param auth - The Firebase Auth instance
 * @param db - The Firebase Firestore instance
 * @param email - The staff email
 * @param password - The staff password
 */
export async function signInAdminUser(
  auth: Auth, 
  db: Firestore, 
  email: string, 
  password: string
): Promise<AdminLoginResult> {
  
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
    if (userData?.role !== 'admin') {
      await signOut(auth); // Log them out if they are not an admin
      return { 
        success: false, 
        message: 'Access Denied: You do not have administrator privileges.' 
      };
    }

    // 5. Success
    return { 
      success: true, 
      user: user 
    };

  } catch (error: any) {
    console.error("Admin Login Error:", error);
    
    // Return a clean error message
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/user-not-found') errorMessage = 'No staff account found with this email.';
    if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
    if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';
    if (error.code === 'permission-denied') errorMessage = 'Database permission denied. Check your rules.';

    return { 
      success: false, 
      message: errorMessage 
    };
  }
}
