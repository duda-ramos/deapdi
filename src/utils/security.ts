import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitize plain text input
 * Note: We don't trim() during input to preserve user experience
 * Trimming should be done on form submission, not during typing
 */
export const sanitizeText = (input: string): string => {
  // Remove only dangerous characters, keep spaces and length as-is during input
  return input
    .replace(/[<>]/g, '') // Remove only HTML tag brackets
    .substring(0, 5000); // Increased limit, trim should be done on submit
};

/**
 * Validate email format
 * Uses a more robust regex that validates:
 * - Local part: alphanumeric, dots, hyphens, underscores, plus signs
 * - Domain part: at least 2 characters
 * - TLD: at least 2 characters
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322 inspired regex - more comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  // Additional checks
  if (!email || email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  if (parts[0].length > 64) return false;
  if (parts[1].split('.').some(part => part.length > 63)) return false;
  
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requires: minimum 8 characters, at least one uppercase, one lowercase, and one number
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber;
};

/**
 * Get password validation errors for user feedback
 */
export const getPasswordErrors = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  
  return errors;
};

/**
 * Rate limiting for API calls
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly enabled: boolean;

  constructor(maxRequests = 100, windowMs = 60000, enabled = true) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.enabled = enabled && import.meta.env.VITE_ENABLE_RATE_LIMITING === 'true';
  }

  canMakeRequest(key: string): boolean {
    if (!this.enabled) return true;
    
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      console.warn(`Rate limit exceeded for key: ${key}`);
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  getRemainingRequests(key: string): number {
    if (!this.enabled) return this.maxRequests;
    
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  getResetTime(key: string): number {
    if (!this.enabled) return 0;
    
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }
}

// Create and export API rate limiter instance
export const apiRateLimiter = new RateLimiter(100, 60000, true);
