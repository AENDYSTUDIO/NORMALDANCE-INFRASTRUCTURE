/**
 * Utility Logger for NORMALDANCE
 * Provides structured logging with different levels
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    // Skip debug logs in production unless explicitly enabled
    if (level === 'debug' && process.env.NODE_ENV === 'production') {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    // Format log output
    const formattedLog = this.formatLog(logEntry);

    // Output to console with appropriate level
    switch (level) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'debug':
        console.debug(formattedLog);
        break;
    }

    // In production, you might want to send logs to external service
    if (process.env.NODE_ENV === 'production' && level !== 'debug') {
      this.sendToExternalLogging(logEntry);
    }
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, service, metadata, error } = entry;
    
    let logString = `${timestamp} [${level.toUpperCase()}] ${service}: ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      logString += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    
    if (error) {
      logString += ` | Error: ${error.name}: ${error.message}`;
      if (error.stack) {
        logString += `\nStack: ${error.stack}`;
      }
    }
    
    return logString;
  }

  private async sendToExternalLogging(entry: LogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // Could be sent to services like:
    // - Sentry
    // - LogDNA
    // - CloudWatch
    // - Custom logging endpoint
    
    try {
      // Example: Send to custom endpoint
      if (process.env.LOG_ENDPOINT) {
        await fetch(process.env.LOG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOG_API_KEY || ''}`,
          },
          body: JSON.stringify(entry),
        });
      }
    } catch (error) {
      // Don't let logging errors crash the application
      console.warn('Failed to send log to external service:', error);
    }
  }

  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log('error', message, metadata, error);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }
}

export function createLogger(service: string): Logger {
  return new Logger(service);
}

export default Logger;
