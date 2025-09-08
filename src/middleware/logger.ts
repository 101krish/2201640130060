import { LogEntry, LogLevel } from '../types';

/**
 * Production-grade logging middleware for Affordmed Technologies
 * All application events must use this logger instead of console.log
 */
class Logger {
  private static instance: Logger;
  private readonly API_ENDPOINT = 'https://httpbin.org/post'; // Placeholder for actual Affordmed API
  private logQueue: LogEntry[] = [];
  private isProcessing = false;

  private constructor() {
    // Start processing queue
    this.processQueue();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Main logging function - sends POST request to Affordmed log API
   * @param stack - Application stack (e.g., "frontend")
   * @param level - Log level: "info" | "warn" | "error" | "debug"
   * @param packageName - Component/package name (e.g., "url-shortener", "analytics")
   * @param message - Log message
   * @param metadata - Additional context data
   */
  public async Log(
    stack: string,
    level: LogLevel,
    packageName: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const logEntry: LogEntry = {
      stack,
      level,
      package: packageName,
      message,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getSessionId(),
      },
    };

    // Add to queue for batch processing
    this.logQueue.push(logEntry);

    // For critical errors, attempt immediate send
    if (level === 'error') {
      await this.sendLog(logEntry);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  public info(packageName: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.Log('frontend', 'info', packageName, message, metadata);
  }

  public warn(packageName: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.Log('frontend', 'warn', packageName, message, metadata);
  }

  public error(packageName: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.Log('frontend', 'error', packageName, message, metadata);
  }

  public debug(packageName: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.Log('frontend', 'debug', packageName, message, metadata);
  }

  /**
   * Send individual log entry to API
   */
  private async sendLog(logEntry: LogEntry): Promise<void> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'affordmed-frontend-logs', // Placeholder for actual API key
        },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        // Fallback to console for logging errors (only for logger failures)
        console.error('Failed to send log to API:', response.statusText);
      }
    } catch (error) {
      // Fallback to console for critical logging failures
      console.error('Logger API error:', error);
    }
  }

  /**
   * Process log queue in batches
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      setTimeout(() => this.processQueue(), 5000); // Check every 5 seconds
      return;
    }

    this.isProcessing = true;
    const logsToProcess = [...this.logQueue];
    this.logQueue = [];

    try {
      // Send logs in batch
      await Promise.all(logsToProcess.map(log => this.sendLog(log)));
    } catch (error) {
      // Re-queue failed logs
      this.logQueue.unshift(...logsToProcess);
    }

    this.isProcessing = false;
    setTimeout(() => this.processQueue(), 5000);
  }

  /**
   * Get or create session ID for tracking
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('affordmed_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('affordmed_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Log user actions for analytics
   */
  public logUserAction(action: string, component: string, metadata?: Record<string, any>): Promise<void> {
    return this.info('user-analytics', `User action: ${action}`, {
      component,
      action,
      ...metadata,
    });
  }

  /**
   * Log URL shortener specific events
   */
  public logUrlEvent(event: string, shortcode?: string, metadata?: Record<string, any>): Promise<void> {
    return this.info('url-shortener', event, {
      shortcode,
      ...metadata,
    });
  }

  /**
   * Log analytics events (clicks, redirects, etc.)
   */
  public logAnalyticsEvent(event: string, shortcode: string, metadata?: Record<string, any>): Promise<void> {
    return this.info('analytics', event, {
      shortcode,
      ...metadata,
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export the main Log function for direct use
export const Log = logger.Log.bind(logger);