import { ShortUrl, ClickEvent } from '../types';
import { logger } from '../middleware/logger';

/**
 * Storage service for persisting URL data in localStorage
 * Handles all data persistence operations with error handling and logging
 */
class StorageService {
  private static instance: StorageService;
  private readonly URLS_KEY = 'affordmed_short_urls';
  private readonly CLICKS_KEY = 'affordmed_clicks';

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Save short URLs to localStorage
   */
  public saveUrls(urls: ShortUrl[]): void {
    try {
      const serialized = JSON.stringify(urls, (key, value) => {
        if (key === 'createdAt' || key === 'expiresAt' || key === 'timestamp') {
          return value instanceof Date ? value.toISOString() : value;
        }
        return value;
      });
      
      localStorage.setItem(this.URLS_KEY, serialized);
      logger.info('storage', 'URLs saved to localStorage', { count: urls.length });
    } catch (error) {
      logger.error('storage', 'Failed to save URLs to localStorage', { error: error.message });
      throw new Error('Failed to save data to storage');
    }
  }

  /**
   * Load short URLs from localStorage
   */
  public loadUrls(): ShortUrl[] {
    try {
      const stored = localStorage.getItem(this.URLS_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      const urls = parsed.map((url: any) => ({
        ...url,
        createdAt: new Date(url.createdAt),
        expiresAt: new Date(url.expiresAt),
        clicks: url.clicks.map((click: any) => ({
          ...click,
          timestamp: new Date(click.timestamp),
        })),
      }));

      logger.info('storage', 'URLs loaded from localStorage', { count: urls.length });
      return urls;
    } catch (error) {
      logger.error('storage', 'Failed to load URLs from localStorage', { error: error.message });
      return [];
    }
  }

  /**
   * Add a new short URL
   */
  public addUrl(url: ShortUrl): void {
    const urls = this.loadUrls();
    urls.push(url);
    this.saveUrls(urls);
    logger.logUrlEvent('URL created', url.shortcode, {
      originalUrl: url.originalUrl,
      validityMinutes: url.validityMinutes,
      isCustomShortcode: url.isCustomShortcode,
    });
  }

  /**
   * Add multiple URLs
   */
  public addUrls(newUrls: ShortUrl[]): void {
    const existingUrls = this.loadUrls();
    const allUrls = [...existingUrls, ...newUrls];
    this.saveUrls(allUrls);
    logger.logUrlEvent('Multiple URLs created', '', { count: newUrls.length });
  }

  /**
   * Find URL by shortcode
   */
  public findByShortcode(shortcode: string): ShortUrl | null {
    const urls = this.loadUrls();
    const found = urls.find(url => url.shortcode === shortcode);
    
    if (found) {
      // Check if URL has expired
      if (new Date() > found.expiresAt) {
        logger.warn('storage', 'Attempted to access expired URL', { shortcode });
        return null;
      }
    }
    
    return found || null;
  }

  /**
   * Record a click event for a short URL
   */
  public recordClick(shortcode: string, clickEvent: ClickEvent): void {
    const urls = this.loadUrls();
    const urlIndex = urls.findIndex(url => url.shortcode === shortcode);
    
    if (urlIndex === -1) {
      logger.warn('storage', 'Attempted to record click for non-existent URL', { shortcode });
      return;
    }

    urls[urlIndex].clicks.push(clickEvent);
    this.saveUrls(urls);
    
    logger.logAnalyticsEvent('URL clicked', shortcode, {
      referrer: clickEvent.referrer,
      totalClicks: urls[urlIndex].clicks.length,
    });
  }

  /**
   * Check if shortcode is already in use
   */
  public isShortcodeInUse(shortcode: string): boolean {
    const urls = this.loadUrls();
    return urls.some(url => url.shortcode === shortcode);
  }

  /**
   * Get analytics data for all URLs
   */
  public getAnalytics(): {
    totalUrls: number;
    totalClicks: number;
    activeUrls: number;
    expiredUrls: number;
  } {
    const urls = this.loadUrls();
    const now = new Date();
    
    const analytics = {
      totalUrls: urls.length,
      totalClicks: urls.reduce((sum, url) => sum + url.clicks.length, 0),
      activeUrls: urls.filter(url => url.expiresAt > now).length,
      expiredUrls: urls.filter(url => url.expiresAt <= now).length,
    };

    logger.info('analytics', 'Analytics data retrieved', analytics);
    return analytics;
  }

  /**
   * Clear all stored data (for testing/reset)
   */
  public clearAll(): void {
    localStorage.removeItem(this.URLS_KEY);
    localStorage.removeItem(this.CLICKS_KEY);
    logger.warn('storage', 'All stored data cleared');
  }

  /**
   * Get URLs with pagination
   */
  public getUrlsPaginated(page: number = 0, limit: number = 10): {
    urls: ShortUrl[];
    total: number;
    hasMore: boolean;
  } {
    const allUrls = this.loadUrls().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const start = page * limit;
    const end = start + limit;
    
    return {
      urls: allUrls.slice(start, end),
      total: allUrls.length,
      hasMore: end < allUrls.length,
    };
  }
}

export const storageService = StorageService.getInstance();