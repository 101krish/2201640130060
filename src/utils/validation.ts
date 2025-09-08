import { CreateUrlRequest, ValidationError } from '../types';
import { logger } from '../middleware/logger';

/**
 * Validation utilities for URL shortener
 * All validation logic with comprehensive error handling
 */

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate shortcode format (alphanumeric, 3-20 characters)
 */
export function isValidShortcode(shortcode: string): boolean {
  const pattern = /^[a-zA-Z0-9]{3,20}$/;
  return pattern.test(shortcode);
}

/**
 * Validate validity minutes (positive integer, max 10080 = 1 week)
 */
export function isValidValidityMinutes(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes > 0 && minutes <= 10080;
}

/**
 * Generate random shortcode
 */
export function generateShortcode(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate a single URL creation request
 */
export function validateUrlRequest(request: CreateUrlRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate original URL
  if (!request.originalUrl || request.originalUrl.trim() === '') {
    errors.push({ field: 'originalUrl', message: 'URL is required' });
  } else if (!isValidUrl(request.originalUrl.trim())) {
    errors.push({ field: 'originalUrl', message: 'Invalid URL format. Must start with http:// or https://' });
  }

  // Validate validity minutes
  if (request.validityMinutes !== undefined) {
    if (!isValidValidityMinutes(request.validityMinutes)) {
      errors.push({ 
        field: 'validityMinutes', 
        message: 'Validity must be a positive integer between 1 and 10080 minutes (1 week)' 
      });
    }
  }

  // Validate custom shortcode
  if (request.customShortcode !== undefined && request.customShortcode.trim() !== '') {
    if (!isValidShortcode(request.customShortcode.trim())) {
      errors.push({ 
        field: 'customShortcode', 
        message: 'Shortcode must be 3-20 characters long and contain only letters and numbers' 
      });
    }
  }

  // Log validation results
  if (errors.length > 0) {
    logger.warn('validation', 'URL request validation failed', { 
      errors: errors.map(e => `${e.field}: ${e.message}`) 
    });
  }

  return errors;
}

/**
 * Validate multiple URL creation requests
 */
export function validateUrlRequests(requests: CreateUrlRequest[]): {
  valid: CreateUrlRequest[];
  errors: Array<{ index: number; errors: ValidationError[] }>;
} {
  if (requests.length === 0) {
    logger.warn('validation', 'No URLs provided for validation');
    return { valid: [], errors: [{ index: 0, errors: [{ field: 'general', message: 'At least one URL is required' }] }] };
  }

  if (requests.length > 5) {
    logger.warn('validation', 'Too many URLs provided', { count: requests.length });
    return { 
      valid: [], 
      errors: [{ 
        index: 0, 
        errors: [{ field: 'general', message: 'Maximum 5 URLs allowed per request' }] 
      }] 
    };
  }

  const valid: CreateUrlRequest[] = [];
  const errors: Array<{ index: number; errors: ValidationError[] }> = [];
  const usedShortcodes = new Set<string>();

  requests.forEach((request, index) => {
    const requestErrors = validateUrlRequest(request);
    
    // Check for duplicate custom shortcodes within the same request
    if (request.customShortcode && request.customShortcode.trim() !== '') {
      const shortcode = request.customShortcode.trim();
      if (usedShortcodes.has(shortcode)) {
        requestErrors.push({ 
          field: 'customShortcode', 
          message: 'Duplicate shortcode in request' 
        });
      } else {
        usedShortcodes.add(shortcode);
      }
    }

    if (requestErrors.length === 0) {
      valid.push(request);
    } else {
      errors.push({ index, errors: requestErrors });
    }
  });

  logger.info('validation', 'Bulk validation completed', {
    totalRequests: requests.length,
    validRequests: valid.length,
    errorRequests: errors.length,
  });

  return { valid, errors };
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string): string {
  return url.trim();
}

/**
 * Sanitize shortcode input
 */
export function sanitizeShortcode(shortcode: string): string {
  return shortcode.trim().replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field}: ${error.message}`).join(', ');
}