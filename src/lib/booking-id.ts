// Booking ID Generator - Professional, Secure, Tax-Standardized Format
// Format: KAPP-YYYYMMDD-XXXX-CC
// Where:
// - KAPP: Clinic prefix
// - YYYYMMDD: Date of booking
// - XXXX: 4-character alphanumeric random code (excludes ambiguous characters)
// - CC: 2-character checksum for validation

// Characters that are unambiguous (no O/0, I/1/L confusion)
const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generates a cryptographically secure random string
 * @param length - Length of the random string
 * @returns Random alphanumeric string
 */
function generateSecureRandom(length: number): string {
  const array = new Uint32Array(length);
  
  // Try browser crypto API first
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    // Node.js 19+ or edge runtimes
    globalThis.crypto.getRandomValues(array);
  } else {
    // Throw error if no secure random available - booking IDs require cryptographic security
    throw new Error('Secure random generation not available. Booking IDs require cryptographic security.');
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SAFE_CHARS[array[i] % SAFE_CHARS.length];
  }
  return result;
}

/**
 * Calculates a simple checksum for validation
 * Uses a modified Luhn algorithm adapted for alphanumeric
 * @param str - String to calculate checksum for
 * @returns 2-character checksum
 */
function calculateChecksum(str: string): string {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    sum += charCode * (i + 1);
  }
  
  // Generate 2-character checksum
  const checksum1 = SAFE_CHARS[sum % SAFE_CHARS.length];
  const checksum2 = SAFE_CHARS[Math.floor(sum / SAFE_CHARS.length) % SAFE_CHARS.length];
  
  return checksum1 + checksum2;
}

/**
 * Generates a professional, secure booking ID
 * Format: KAPP-YYYYMMDD-XXXX-CC
 * 
 * Philippines BIR (Bureau of Internal Revenue) considerations:
 * - Sequential date component for audit trails
 * - Unique identifier for each transaction
 * - Checksum for data integrity
 * - Human-readable format
 * 
 * @param date - Optional date for the booking (defaults to now)
 * @returns Formatted booking ID string
 */
export function generateBookingId(date?: Date): string {
  const bookingDate = date || new Date();
  
  // Format date as YYYYMMDD
  const year = bookingDate.getFullYear();
  const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
  const day = String(bookingDate.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate 4-character random code
  const randomCode = generateSecureRandom(4);
  
  // Create base ID
  const baseId = `KAPP-${dateStr}-${randomCode}`;
  
  // Calculate checksum
  const checksum = calculateChecksum(baseId);
  
  return `${baseId}-${checksum}`;
}

/**
 * Validates a booking ID format and checksum
 * @param bookingId - The booking ID to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateBookingId(bookingId: string): { isValid: boolean; error?: string } {
  // Check format
  const pattern = /^KAPP-\d{8}-[A-Z2-9]{4}-[A-Z2-9]{2}$/;
  if (!pattern.test(bookingId)) {
    return { isValid: false, error: 'Invalid booking ID format' };
  }
  
  // Extract components
  const parts = bookingId.split('-');
  const baseId = `${parts[0]}-${parts[1]}-${parts[2]}`;
  const providedChecksum = parts[3];
  
  // Verify checksum
  const calculatedChecksum = calculateChecksum(baseId);
  if (providedChecksum !== calculatedChecksum) {
    return { isValid: false, error: 'Invalid booking ID checksum' };
  }
  
  // Validate date
  const dateStr = parts[1];
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime()) || 
      date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day) {
    return { isValid: false, error: 'Invalid date in booking ID' };
  }
  
  return { isValid: true };
}

/**
 * Extracts the date from a booking ID
 * @param bookingId - The booking ID to parse
 * @returns Date object or null if invalid
 */
export function getBookingDate(bookingId: string): Date | null {
  const validation = validateBookingId(bookingId);
  if (!validation.isValid) {
    return null;
  }
  
  const dateStr = bookingId.split('-')[1];
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  
  return new Date(year, month - 1, day);
}

/**
 * Formats a booking ID for display (adds spaces for readability)
 * @param bookingId - The booking ID to format
 * @returns Formatted string for display
 */
export function formatBookingIdForDisplay(bookingId: string): string {
  // Already human-readable with dashes
  return bookingId;
}
