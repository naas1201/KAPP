/**
 * Firebase Auth to D1 Database Sync
 * 
 * This module provides utilities to sync Firebase Auth users to the D1 database.
 * Since we keep Firebase Auth for authentication, we need to sync user data
 * to D1 for app-specific data storage and queries.
 * 
 * @see https://firebase.google.com/docs/auth
 */

import type { D1Database } from '../types';
import { getUserByFirebaseUid, createUser, getUserByEmail, updateUserRole } from '../db';

/**
 * Firebase user data structure (subset of Firebase User object)
 */
export interface FirebaseUserData {
  uid: string;
  email: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  userId: string;
  isNewUser: boolean;
  error?: string;
}

/**
 * Sync a Firebase Auth user to the D1 database
 * 
 * Call this function after successful Firebase Auth login/signup to ensure
 * the user exists in the D1 database.
 * 
 * @param db - D1 database instance
 * @param firebaseUser - Firebase user data
 * @param role - User role (defaults to 'patient')
 * @returns Sync result with user ID
 */
export async function syncUserToD1(
  db: D1Database,
  firebaseUser: FirebaseUserData,
  role: 'patient' | 'doctor' | 'admin' = 'patient'
): Promise<SyncResult> {
  try {
    // Check if user already exists by Firebase UID
    const existingUser = await getUserByFirebaseUid(db, firebaseUser.uid);
    
    if (existingUser) {
      // User already exists, no need to create
      return {
        success: true,
        userId: existingUser.id,
        isNewUser: false,
      };
    }
    
    // User doesn't exist, check if email is already used
    if (firebaseUser.email) {
      const userByEmail = await getUserByEmail(db, firebaseUser.email);
      if (userByEmail) {
        // Email exists but different Firebase UID - this is a conflict
        // This could happen if user was created manually in D1
        return {
          success: false,
          userId: '',
          isNewUser: false,
          error: 'Email already exists with different account',
        };
      }
    }
    
    // Create new user in D1
    await createUser(db, {
      id: firebaseUser.uid, // Use Firebase UID as D1 user ID for consistency
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email || `${firebaseUser.uid}@noemail.local`,
      role,
      name: firebaseUser.displayName || undefined,
      phone: firebaseUser.phoneNumber || undefined,
    });
    
    return {
      success: true,
      userId: firebaseUser.uid,
      isNewUser: true,
    };
  } catch (error) {
    console.error('Error syncing user to D1:', error);
    return {
      success: false,
      userId: '',
      isNewUser: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a user is a staff member (doctor or admin)
 * 
 * @param db - D1 database instance
 * @param firebaseUid - Firebase user UID
 * @returns User role if staff, null if patient or not found
 */
export async function checkStaffRole(
  db: D1Database,
  firebaseUid: string
): Promise<{ role: 'doctor' | 'admin'; userId: string } | null> {
  const user = await getUserByFirebaseUid(db, firebaseUid);
  
  if (!user) {
    return null;
  }
  
  if (user.role === 'doctor' || user.role === 'admin') {
    return {
      role: user.role,
      userId: user.id,
    };
  }
  
  return null;
}

/**
 * Upgrade a patient to staff member
 * 
 * @param db - D1 database instance
 * @param firebaseUid - Firebase user UID
 * @param newRole - New role to assign
 * @returns Success status
 */
export async function upgradeUserRole(
  db: D1Database,
  firebaseUid: string,
  newRole: 'doctor' | 'admin'
): Promise<boolean> {
  try {
    const user = await getUserByFirebaseUid(db, firebaseUid);
    
    if (!user) {
      return false;
    }
    
    await updateUserRole(db, user.id, newRole);
    return true;
  } catch (error) {
    console.error('Error upgrading user role:', error);
    return false;
  }
}

/**
 * Get user role from D1 database
 * 
 * @param db - D1 database instance
 * @param firebaseUid - Firebase user UID
 * @returns User role or null if not found
 */
export async function getUserRole(
  db: D1Database,
  firebaseUid: string
): Promise<'patient' | 'doctor' | 'admin' | null> {
  const user = await getUserByFirebaseUid(db, firebaseUid);
  return user?.role ?? null;
}

/**
 * Ensure user exists in D1 (create if not exists)
 * This is a convenience function for the common pattern of checking
 * and creating users on first login.
 * 
 * @param db - D1 database instance
 * @param firebaseUser - Firebase user data
 * @returns User ID (existing or newly created)
 */
export async function ensureUserInD1(
  db: D1Database,
  firebaseUser: FirebaseUserData
): Promise<string | null> {
  const result = await syncUserToD1(db, firebaseUser);
  return result.success ? result.userId : null;
}
