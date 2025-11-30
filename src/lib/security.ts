// Security Utilities - OWASP Compliance
// Input sanitization, validation, and security helpers

/**
 * Sanitizes a string by removing potentially dangerous characters
 * Prevents XSS (Cross-Site Scripting) attacks
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Encode special HTML characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Sanitizes HTML content - allows safe tags only
 * For rich text inputs
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  
  // Allow only safe tags
  const allowedTags = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'span'];
  const tagPattern = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})\\b)[^>]+>`, 'gi');
  
  return input
    // Remove disallowed tags
    .replace(tagPattern, '')
    // Remove on* event handlers from allowed tags
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validates email format (OWASP recommendation)
 */
export function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates Philippine phone number format
 */
export function isValidPhilippinePhone(phone: string): boolean {
  // Philippine mobile: +63 9XX XXX XXXX or 09XX XXX XXXX
  const phoneRegex = /^(\+63|0)?9\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

/**
 * Validates password strength (OWASP guidelines)
 */
export function validatePasswordStrength(password: string): { 
  isValid: boolean; 
  score: number; 
  feedback: string[] 
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check (minimum 8, recommended 12+)
  if (password.length >= 8) {
    score += 1;
    if (password.length >= 12) score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long.');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one uppercase letter.');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one lowercase letter.');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one number.');
  }
  
  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one special character.');
  }
  
  // Common password patterns to avoid
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /111111/,
    /12345678/,
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common password patterns.');
  }
  
  return {
    isValid: score >= 4 && password.length >= 8,
    score,
    feedback,
  };
}

/**
 * Rate limiting helper for client-side
 * Tracks attempts and enforces delays
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;
  
  constructor(
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    blockDurationMs: number = 30 * 60 * 1000 // 30 minutes
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }
  
  /**
   * Check if an action is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record) {
      return true;
    }
    
    // Check if block period has passed
    if (record.count >= this.maxAttempts) {
      if (now - record.firstAttempt > this.blockDurationMs) {
        this.attempts.delete(key);
        return true;
      }
      return false;
    }
    
    // Check if window has passed
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.delete(key);
      return true;
    }
    
    return record.count < this.maxAttempts;
  }
  
  /**
   * Record an attempt
   */
  recordAttempt(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now - record.firstAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
    } else {
      record.count += 1;
    }
  }
  
  /**
   * Reset attempts for a key (e.g., on successful login)
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  /**
   * Get remaining attempts
   */
  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return this.maxAttempts;
    return Math.max(0, this.maxAttempts - record.count);
  }
  
  /**
   * Get time until reset (in seconds)
   */
  getTimeUntilReset(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    
    const elapsed = Date.now() - record.firstAttempt;
    const duration = record.count >= this.maxAttempts ? this.blockDurationMs : this.windowMs;
    
    return Math.max(0, Math.ceil((duration - elapsed) / 1000));
  }
}

/**
 * CSRF Token generator and validator
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates that input doesn't contain SQL injection patterns
 * Note: Not for actual SQL protection (use parameterized queries)
 * but for additional validation layer
 */
export function containsSqlInjectionPatterns(input: string): boolean {
  const patterns = [
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
    /--/,
    /;.*\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b/i,
    /'\s*OR\s+'1'\s*=\s*'1/i,
  ];
  
  return patterns.some(pattern => pattern.test(input));
}

/**
 * Validates that input doesn't contain NoSQL injection patterns
 * Specific to MongoDB/Firestore
 */
export function containsNoSqlInjectionPatterns(input: string): boolean {
  const patterns = [
    /\$\w+/,  // MongoDB operators like $gt, $lt, $where
    /\{.*\}/,  // JSON objects
    /\[.*\]/,  // JSON arrays (when not expected)
  ];
  
  return patterns.some(pattern => pattern.test(input));
}

/**
 * Generates a secure random ID
 */
export function generateSecureId(length: number = 16): string {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Content Security Policy helper
 * Returns CSP meta tag content for different contexts
 */
export function getCSPDirectives(context: 'default' | 'strict' = 'default'): string {
  const directives = {
    default: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com",
      "frame-src 'self' https://*.stripe.com",
    ],
    strict: [
      "default-src 'self'",
      "script-src 'self' https://apis.google.com https://www.gstatic.com",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ],
  };
  
  return directives[context].join('; ');
}

/**
 * Sanitizes file name for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length
}

/**
 * Validates file type based on extension and MIME type
 * Uses exact matching for security
 */
export async function validateFileType(file: File, allowedExtensions: string[], allowedMimeTypes: string[]): Promise<boolean> {
  // Check extension first
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return false;
  }
  
  // Check MIME type with exact matching for security
  if (!allowedMimeTypes.includes(file.type)) {
    return false;
  }
  
  return true;
}
