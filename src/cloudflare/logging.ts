/**
 * Cloudflare Workers Structured Logging
 * 
 * This module provides utilities for structured logging in Cloudflare Workers.
 * Logs are viewable in real-time via the Cloudflare Dashboard.
 * 
 * Features:
 * - Structured JSON logging
 * - Log levels (debug, info, warn, error)
 * - Request context tracking
 * - Performance timing
 * 
 * @see https://developers.cloudflare.com/workers/observability/logs/
 */

import type { CloudflareContext, ExecutionContext } from './types';

/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Include stack traces in error logs */
  includeStackTraces: boolean;
  /** Application name for log context */
  appName: string;
  /** Environment (production, development) */
  environment: string;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: 'info',
  includeStackTraces: true,
  appName: 'kapp-medical',
  environment: 'production',
};

/**
 * Current logger configuration
 */
let currentConfig: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * Request context for correlation
 */
let requestContext: {
  requestId?: string;
  userId?: string;
  startTime?: number;
} = {};

/**
 * Configure the logger
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Initialize logger from Cloudflare environment
 */
export function initLoggerFromEnv(context: CloudflareContext | null): void {
  if (!context?.env) return;
  
  const logLevel = context.env.LOG_LEVEL || 'info';
  const environment = context.env.ENVIRONMENT || 'production';
  
  configureLogger({
    minLevel: logLevel,
    environment,
    includeStackTraces: environment !== 'production',
  });
}

/**
 * Set request context for log correlation
 */
export function setRequestContext(context: {
  requestId?: string;
  userId?: string;
}): void {
  requestContext = {
    ...requestContext,
    ...context,
    startTime: Date.now(),
  };
}

/**
 * Clear request context
 */
export function clearRequestContext(): void {
  requestContext = {};
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentConfig.minLevel];
}

/**
 * Format a log entry as JSON
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify({
    ...entry,
    app: currentConfig.appName,
    env: currentConfig.environment,
  });
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: requestContext.requestId,
    userId: requestContext.userId,
  };
  
  if (requestContext.startTime) {
    entry.duration = Date.now() - requestContext.startTime;
  }
  
  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }
  
  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
    };
    if (currentConfig.includeStackTraces && error.stack) {
      entry.error.stack = error.stack;
    }
  }
  
  return entry;
}

/**
 * Log a debug message
 */
export function debug(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('debug')) return;
  const entry = createLogEntry('debug', message, context);
  console.debug(formatLogEntry(entry));
}

/**
 * Log an info message
 */
export function info(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('info')) return;
  const entry = createLogEntry('info', message, context);
  console.info(formatLogEntry(entry));
}

/**
 * Log a warning message
 */
export function warn(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('warn')) return;
  const entry = createLogEntry('warn', message, context);
  console.warn(formatLogEntry(entry));
}

/**
 * Log an error message
 */
export function error(
  message: string,
  errorOrContext?: Error | Record<string, unknown>,
  context?: Record<string, unknown>
): void {
  if (!shouldLog('error')) return;
  
  let err: Error | undefined;
  let ctx: Record<string, unknown> | undefined;
  
  if (errorOrContext instanceof Error) {
    err = errorOrContext;
    ctx = context;
  } else {
    ctx = errorOrContext;
  }
  
  const entry = createLogEntry('error', message, ctx, err);
  console.error(formatLogEntry(entry));
}

/**
 * Log request start (for middleware)
 */
export function logRequestStart(request: Request): string {
  const requestId = generateRequestId();
  const url = new URL(request.url);
  
  setRequestContext({ requestId });
  
  info('Request started', {
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: request.headers.get('user-agent'),
    cfRay: request.headers.get('cf-ray'),
    cfCountry: request.headers.get('cf-ipcountry'),
  });
  
  return requestId;
}

/**
 * Log request end (for middleware)
 */
export function logRequestEnd(
  status: number,
  additionalContext?: Record<string, unknown>
): void {
  const duration = requestContext.startTime 
    ? Date.now() - requestContext.startTime 
    : undefined;
  
  const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  
  const logFn = level === 'error' ? error : level === 'warn' ? warn : info;
  
  logFn('Request completed', {
    status,
    duration,
    ...additionalContext,
  });
  
  clearRequestContext();
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(baseContext: Record<string, unknown>) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: Record<string, unknown>) =>
      info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: Record<string, unknown>) =>
      warn(message, { ...baseContext, ...context }),
    error: (
      message: string,
      errorOrContext?: Error | Record<string, unknown>,
      context?: Record<string, unknown>
    ) => {
      if (errorOrContext instanceof Error) {
        error(message, errorOrContext, { ...baseContext, ...context });
      } else {
        error(message, { ...baseContext, ...errorOrContext, ...context });
      }
    },
  };
}

/**
 * Performance timing utilities
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * Log operation with timing
 */
export async function logOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const timer = startTimer();
  
  debug(`${operationName} started`, context);
  
  try {
    const result = await operation();
    info(`${operationName} completed`, {
      ...context,
      duration: timer(),
    });
    return result;
  } catch (err) {
    error(`${operationName} failed`, err instanceof Error ? err : undefined, {
      ...context,
      duration: timer(),
    });
    throw err;
  }
}

/**
 * Use waitUntil to log asynchronously without blocking response
 */
export function logAsync(
  ctx: ExecutionContext | null,
  logFn: () => void
): void {
  if (ctx) {
    ctx.waitUntil(Promise.resolve().then(logFn));
  } else {
    logFn();
  }
}

/**
 * Export all logging functions as a namespace
 */
export const logger = {
  debug,
  info,
  warn,
  error,
  setRequestContext,
  clearRequestContext,
  generateRequestId,
  logRequestStart,
  logRequestEnd,
  createChildLogger,
  startTimer,
  logOperation,
  logAsync,
  configure: configureLogger,
  initFromEnv: initLoggerFromEnv,
};

export default logger;
