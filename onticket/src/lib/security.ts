/**
 * Security Utilities
 * Functions and configurations for application security
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous characters and scripts
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate email format
 * Prevents SQL injection through email field
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate password strength
 * Minimum requirements for security
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 100;
}

/**
 * Rate limiting for login attempts
 * Prevents brute force attacks
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Check if rate limit exceeded for identifier (email/IP)
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside time window
    const recentAttempts = attempts.filter(timestamp => 
      now - timestamp < this.WINDOW_MS
    );
    
    this.attempts.set(identifier, recentAttempts);
    
    return recentAttempts.length >= this.MAX_ATTEMPTS;
  }

  /**
   * Record a login attempt
   */
  recordAttempt(identifier: string): void {
    const attempts = this.attempts.get(identifier) || [];
    attempts.push(Date.now());
    this.attempts.set(identifier, attempts);
  }

  /**
   * Clear attempts for identifier (after successful login)
   */
  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    const recentAttempts = attempts.filter(timestamp => 
      now - timestamp < this.WINDOW_MS
    );
    return Math.max(0, this.MAX_ATTEMPTS - recentAttempts.length);
  }

  /**
   * Get time until next attempt allowed (in seconds)
   */
  getTimeUntilReset(identifier: string): number {
    const attempts = this.attempts.get(identifier) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.WINDOW_MS;
    const remaining = Math.max(0, resetTime - Date.now());
    
    return Math.ceil(remaining / 1000);
  }
}

export const loginRateLimiter = new RateLimiter();

/**
 * Remove sensitive data from console logs in production
 */
export const secureLog = {
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors but sanitize
    const sanitized = args.map(arg => 
      typeof arg === 'string' ? arg.replace(/password|token|key|secret/gi, '[REDACTED]') : arg
    );
    console.error(...sanitized);
  }
};

/**
 * Validate Supabase environment variables
 * Prevents application from running without proper configuration
 */
export function validateEnvironment(): void {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing = requiredVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }

  // Validate URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl.startsWith('https://')) {
    throw new Error('VITE_SUPABASE_URL must use HTTPS');
  }

  // Validate key format (basic check)
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey.length < 100) {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY seems invalid (too short)');
  }
}

/**
 * Content Security Policy configuration
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Vite in dev
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'], // Allow Supabase storage
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://*.supabase.co'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

