/**
 * Centralized Logger for NORMALDANCE
 * Replaces console.log/error/warn throughout the application
 */

import * as Sentry from '@sentry/nextjs'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMetadata {
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class AppLogger {
  private minLevel: LogLevel
  private enabled: boolean
  private sendToSentry: boolean

  constructor() {
    this.minLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    this.enabled = process.env.DISABLE_LOGGING !== 'true'
    this.sendToSentry = process.env.NODE_ENV === 'production'
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  private format(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString()
    const meta = metadata ? ` ${JSON.stringify(metadata)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${meta}`
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message, metadata))
    }
  }

  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message, metadata))
    }
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, metadata))
      if (this.sendToSentry) {
        Sentry.captureMessage(message, { level: 'warning', extra: metadata })
      }
    }
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    if (this.shouldLog('error')) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack, ...metadata }
        : { error, ...metadata }
      
      console.error(this.format('error', message, errorData))
      
      if (this.sendToSentry && error instanceof Error) {
        Sentry.captureException(error, { extra: metadata })
      }
    }
  }

  async time<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
    const start = Date.now()
    this.debug(`${label} started`)
    try {
      const result = await fn()
      this.debug(`${label} completed in ${Date.now() - start}ms`)
      return result
    } catch (error) {
      this.error(`${label} failed`, error as Error)
      throw error
    }
  }
}

export const logger = new AppLogger()
export default logger
