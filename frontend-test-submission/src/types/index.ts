export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortcode: string;
  createdAt: Date;
  expiresAt: Date;
  validityMinutes: number;
  clicks: ClickEvent[];
  isCustomShortcode: boolean;
}

export interface ClickEvent {
  id: string;
  timestamp: Date;
  referrer: string;
  userAgent: string;
  ipAddress?: string;
  geoLocation?: {
    country?: string;
    city?: string;
  };
}

export interface CreateUrlRequest {
  originalUrl: string;
  validityMinutes?: number;
  customShortcode?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  stack: string;
  level: LogLevel;
  package: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type ValidationError = {
  field: string;
  message: string;
};

export interface CreateUrlsResponse {
  success: ShortUrl[];
  errors: Array<{ index: number; error: string }>;
}