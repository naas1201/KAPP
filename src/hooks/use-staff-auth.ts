'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getStaffSession,
  createStaffSession,
  clearStaffSession,
  extendStaffSession,
  type StaffSession,
  type StaffRole,
} from '@/lib/staff-auth';

/**
 * Hook for managing staff authentication state
 */
export function useStaffAuth() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    const currentSession = getStaffSession();
    setSession(currentSession);
    setIsLoading(false);
  }, []);

  // Login function with optional rememberDevice flag
  const login = useCallback((email: string, role: StaffRole, name: string, rememberDevice: boolean = false) => {
    const newSession = createStaffSession(email, role, name, rememberDevice);
    setSession(newSession);
    return newSession;
  }, []);

  // Logout function
  const logout = useCallback(() => {
    clearStaffSession();
    setSession(null);
  }, []);

  // Extend session on activity
  const extendSession = useCallback(() => {
    extendStaffSession();
    const updatedSession = getStaffSession();
    setSession(updatedSession);
  }, []);

  return {
    session,
    isLoading,
    isLoggedIn: session !== null,
    isAdmin: session?.role === 'admin',
    isDoctor: session?.role === 'doctor',
    login,
    logout,
    extendSession,
  };
}
