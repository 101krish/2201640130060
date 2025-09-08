import { v4 as uuidv4 } from 'uuid';
import { ShortUrl, CreateUrlRequest, CreateUrlsResponse, ClickEvent } from '../types';
import { storageService } from './storage';
import { validateUrlRequests, generateShortcode, sanitizeUrl, sanitizeShortcode } from '../utils/validation';
import { logger } from '../middleware/logger';

/**
 * Core URL shortening service
 * Handles all business logic for URL creation, management, and analytics
 */
class UrlService {
  private static instance: UrlService;

  private constructor() {}

  public static getInstance(): UrlService {
    if (!UrlService.instance) {
      UrlService.instance = new UrlService();
    }
    return UrlService.instance;
  }

  /**
   * Create short URLs from requests (1-5 URLs at a time)
   */
  public async createUrls(requests: CreateUrlRequest[]): Promise<CreateUrlsResponse> {
    logger.logUrlEvent('Bulk URL creation started', '', { count: requests.length });

    // Validate all requests
    const { valid, errors } = validateUrlRequests(requests);

    const success: ShortUrl[] = [];
    const finalErrors: Array<{ index: number; error: string }> = [];

    // Convert validation errors to response format
    errors.forEach(({ index, errors: validationErrors }) => {
      finalErrors.push({
        index,
        error: validationErrors.map(e => e.message).join(', ')
      });
    });

    // Process valid requests
    for (const request of valid) {
      try {
        const shortUrl = await this.createSingleUrl(request);
        success.push(shortUrl);
      } catch (error) {
        const originalIndex = requests.findIndex(r => 
          r.originalUrl === request.originalUrl && 
          r.customShortcode === request.customShortcode
        );
        finalErrors.push({
          index: originalIndex,
          error: error.message
        });
      }
    }

    // Save successful URLs to storage
    if (success.length > 0) {
      storageService.addUrls(success);
    }

    const response = { success, errors: finalErrors };
    
    logger.logUrlEvent('Bulk URL creation completed', '', {
      totalRequests: requests.length,
      successCount: success.length,
      errorCount: finalErrors.length
    });

    return response;
  }

  /**
   * Create a single short URL
   */
  private async createSingleUrl(request: CreateUrlRequest): Promise<ShortUrl> {
    const sanitizedUrl = sanitizeUrl(request.originalUrl);
    const validityMinutes = request.validityMinutes || 30; // Default to 30 minutes
    
    let shortcode: string;
    let isCustomShortcode = false;

    // Handle custom shortcode or generate one
    if (request.customShortcode && request.customShortcode.trim() !== '') {
      shortcode = sanitizeShortcode(request.customShortcode);
      isCustomShortcode = true;

      // Check if custom shortcode is already in use
      if (storageService.isShortcodeInUse(shortcode)) {
        throw new Error(`Shortcode "${shortcode}" is already in use`);
      }
    } else {
      // Generate unique shortcode
      shortcode = this.generateUniqueShortcode();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000);

    const shortUrl: ShortUrl = {
      id: uuidv4(),
      originalUrl: sanitizedUrl,
      shortcode,
      createdAt: now,
      expiresAt,
      validityMinutes,
      clicks: [],
      isCustomShortcode,
    };

    logger.logUrlEvent('Single URL created', shortcode, {
      originalUrl: sanitizedUrl,
      validityMinutes,
      isCustomShortcode,
      expiresAt: expiresAt.toISOString(),
    });

    return shortUrl;
  }

  /**
   * Generate a unique shortcode that's not already in use
   */
  private generateUniqueShortcode(attempts: number = 0): string {
    if (attempts > 10) {
      throw new Error('Unable to generate unique shortcode after multiple attempts');
    }

    const shortcode = generateShortcode(6);
    
    if (storageService.isShortcodeInUse(shortcode)) {
      return this.generateUniqueShortcode(attempts + 1);
    }

    return shortcode;
  }

  /**
   * Redirect to original URL and record analytics
   */
  public async redirectUrl(shortcode: string): Promise<string> {
    logger.logAnalyticsEvent('Redirect attempt', shortcode);

    const shortUrl = storageService.findByShortcode(shortcode);
    
    if (!shortUrl) {
      logger.warn('url-service', 'Shortcode not found', { shortcode });
      throw new Error('Short URL not found or has expired');
    }

    // Record click analytics
    const clickEvent: ClickEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
      geoLocation: await this.getGeoLocation(),
    };

    storageService.recordClick(shortcode, clickEvent);

    logger.logAnalyticsEvent('Redirect successful', shortcode, {
      originalUrl: shortUrl.originalUrl,
      referrer: clickEvent.referrer,
      totalClicks: shortUrl.clicks.length + 1,
    });

    return shortUrl.originalUrl;
  }

  /**
   * Get all URLs for statistics page
   */
  public getAllUrls(): ShortUrl[] {
    const urls = storageService.loadUrls();
    logger.info('url-service', 'Retrieved all URLs for statistics', { count: urls.length });
    return urls;
  }

  /**
   * Get URLs with pagination
   */
  public getUrlsPaginated(page: number = 0, limit: number = 10) {
    const result = storageService.getUrlsPaginated(page, limit);
    logger.info('url-service', 'Retrieved paginated URLs', {
      page,
      limit,
      count: result.urls.length,
      total: result.total,
    });
    return result;
  }

  /**
   * Get analytics summary
   */
  public getAnalyticsSummary() {
    const analytics = storageService.getAnalytics();
    logger.info('analytics', 'Analytics summary retrieved', analytics);
    return analytics;
  }

  /**
   * Simple geolocation detection (placeholder implementation)
   */
  private async getGeoLocation(): Promise<{ country?: string; city?: string }> {
    try {
      // In a real implementation, you would use a geolocation API
      // For this demo, we'll use a placeholder
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country_name,
          city: data.city,
        };
      }
    } catch (error) {
      logger.warn('url-service', 'Failed to get geolocation', { error: error.message });
    }
    
    return {};
  }

  /**
   * Check if shortcode exists and is valid
   */
  public isValidShortcode(shortcode: string): boolean {
    const shortUrl = storageService.findByShortcode(shortcode);
    return shortUrl !== null;
  }

  /**
   * Get URL by shortcode for display
   */
  public getUrlByShortcode(shortcode: string): ShortUrl | null {
    return storageService.findByShortcode(shortcode);
  }
}

export const urlService = UrlService.getInstance();