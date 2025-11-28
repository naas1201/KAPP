"use client";

import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

// Corresponds to the duration of vibration in milliseconds for simple patterns
const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 50,
  medium: 100,
  heavy: 150,
  selection: 30, // A short tap
  success: [50, 100, 50], // Quick double-tap
  warning: [100, 50, 100], // Slower double-tap
  error: [75, 50, 75, 50, 75], // Triple-tap
};


/**
 * A hook to provide haptic feedback. It safely checks for `navigator.vibrate`
 * support and provides a function to trigger vibrations.
 *
 * This is primarily for mobile devices and will do nothing on unsupported browsers/devices.
 *
 * @returns {object} An object containing the `triggerHaptic` function.
 */
export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        const pattern = hapticPatterns[type];
        window.navigator.vibrate(pattern);
      } catch (error) {
        console.error("Haptic feedback failed:", error);
      }
    }
  }, []);

  return { triggerHaptic };
}
