'use client';

/**
 * Simple staff authentication system using localStorage
 * This provides a straightforward way for admin and doctors to access the system
 * without depending on complex Firebase Auth role verification.
 */

export type StaffRole = 'admin' | 'doctor';

export interface StaffSession {
  email: string;
  role: StaffRole;
  name: string;
  loggedInAt: number;
  expiresAt: number;
}

const STAFF_SESSION_KEY = 'kapp_staff_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Validate that a parsed object has the required StaffSession structure
 */
function isValidStaffSession(obj: unknown): obj is StaffSession {
  if (typeof obj !== 'object' || obj === null) return false;
  const session = obj as Record<string, unknown>;
  return (
    typeof session.email === 'string' &&
    (session.role === 'admin' || session.role === 'doctor') &&
    typeof session.name === 'string' &&
    typeof session.loggedInAt === 'number' &&
    typeof session.expiresAt === 'number'
  );
}

/**
 * Get the current staff session from localStorage
 */
export function getStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionData = localStorage.getItem(STAFF_SESSION_KEY);
    if (!sessionData) return null;
    
    const parsed: unknown = JSON.parse(sessionData);
    
    // Validate the session structure
    if (!isValidStaffSession(parsed)) {
      console.warn('Invalid staff session structure, clearing');
      clearStaffSession();
      return null;
    }
    
    // Check if session has expired
    if (Date.now() > parsed.expiresAt) {
      clearStaffSession();
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error reading staff session:', error);
    clearStaffSession();
    return null;
  }
}

/**
 * Create a new staff session
 */
export function createStaffSession(email: string, role: StaffRole, name: string): StaffSession {
  const now = Date.now();
  const session: StaffSession = {
    email,
    role,
    name,
    loggedInAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
  }
  
  return session;
}

/**
 * Clear the staff session (logout)
 */
export function clearStaffSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STAFF_SESSION_KEY);
  }
}

/**
 * Check if user is logged in as staff
 */
export function isStaffLoggedIn(): boolean {
  return getStaffSession() !== null;
}

/**
 * Check if user is logged in as admin
 */
export function isAdminLoggedIn(): boolean {
  const session = getStaffSession();
  return session !== null && session.role === 'admin';
}

/**
 * Check if user is logged in as doctor
 */
export function isDoctorLoggedIn(): boolean {
  const session = getStaffSession();
  return session !== null && session.role === 'doctor';
}

/**
 * Extend the session duration (call this on activity)
 */
export function extendStaffSession(): void {
  const session = getStaffSession();
  if (session) {
    session.expiresAt = Date.now() + SESSION_DURATION_MS;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
    }
  }
}
