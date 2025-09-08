export type LogLevel = "info" | "warn" | "error";

export type LogEvent = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp?: string;
};

export type LoggerOptions = {
  apiUrl: string;
  apiKey?: string;
  app?: string;
};

export function createLogger(options: LoggerOptions) {
  const endpoint = options.apiUrl.replace(/\/$/, "");

  return async function log(event: LogEvent) {
    const body = { ...event, app: options.app, timestamp: event.timestamp ?? new Date().toISOString() };

    await fetch(`${endpoint}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
  };
}


