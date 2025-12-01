'use client';

/**
 * Simple staff authentication system using localStorage and cookies
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
  rememberDevice?: boolean;
}

const STAFF_SESSION_KEY = 'kapp_staff_session';
const STAFF_COOKIE_NAME = 'kapp_staff_token';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const EXTENDED_SESSION_DURATION_MS = 180 * 24 * 60 * 60 * 1000; // 180 days (6 months)

/**
 * Cookie utilities for session persistence
 */
export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  
  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isProduction ? '; Secure' : '';
  const sameSite = '; SameSite=Lax';
  
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}${secureFlag}${sameSite}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValueParts.join('='));
    }
  }
  return null;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

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
 * Get the current staff session from localStorage or cookies
 */
export function getStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // First try localStorage
    let sessionData = localStorage.getItem(STAFF_SESSION_KEY);
    
    // Fall back to cookie if localStorage is empty
    if (!sessionData) {
      sessionData = getCookie(STAFF_COOKIE_NAME);
    }
    
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
 * @param email - User email
 * @param role - Staff role (admin or doctor)
 * @param name - Display name
 * @param rememberDevice - If true, extends session to 180 days
 */
export function createStaffSession(
  email: string,
  role: StaffRole,
  name: string,
  rememberDevice: boolean = false
): StaffSession {
  const now = Date.now();
  const sessionDurationMs = rememberDevice ? EXTENDED_SESSION_DURATION_MS : SESSION_DURATION_MS;
  const session: StaffSession = {
    email,
    role,
    name,
    loggedInAt: now,
    expiresAt: now + sessionDurationMs,
    rememberDevice,
  };
  
  if (typeof window !== 'undefined') {
    const sessionJson = JSON.stringify(session);
    // Store in localStorage
    localStorage.setItem(STAFF_SESSION_KEY, sessionJson);
    // Also store in cookie for better persistence
    const maxAgeSeconds = Math.floor(sessionDurationMs / 1000);
    setCookie(STAFF_COOKIE_NAME, sessionJson, maxAgeSeconds);
  }
  
  return session;
}

/**
 * Clear the staff session (logout)
 */
export function clearStaffSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STAFF_SESSION_KEY);
    removeCookie(STAFF_COOKIE_NAME);
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
    const sessionDurationMs = session.rememberDevice ? EXTENDED_SESSION_DURATION_MS : SESSION_DURATION_MS;
    session.expiresAt = Date.now() + sessionDurationMs;
    if (typeof window !== 'undefined') {
      const sessionJson = JSON.stringify(session);
      localStorage.setItem(STAFF_SESSION_KEY, sessionJson);
      const maxAgeSeconds = Math.floor(sessionDurationMs / 1000);
      setCookie(STAFF_COOKIE_NAME, sessionJson, maxAgeSeconds);
    }
  }
}
