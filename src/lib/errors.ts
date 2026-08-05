/** Unique correlation ID for every error instance — survives log aggregation. */
function generateCorrelationId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCode =
  | 'DUPLICATE'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly severity: ErrorSeverity;
  readonly retryable: boolean;
  readonly source: string;

  constructor(
    message: string,
    readonly code: ErrorCode | string,
    readonly statusCode?: number,
    readonly context?: Record<string, unknown>,
    options?: {
      severity?: ErrorSeverity;
      retryable?: boolean;
      source?: string;
      cause?: unknown;
    },
  ) {
    super(message);
    if (options?.cause !== undefined) (this as unknown as { cause?: unknown }).cause = options.cause;
    this.name = 'AppError';
    this.correlationId = generateCorrelationId();
    this.timestamp = new Date();
    this.severity = options?.severity ?? deriveSeverity(code, statusCode);
    this.retryable = options?.retryable ?? deriveRetryable(code, statusCode);
    this.source = options?.source ?? 'client';
  }

  static fromSupabase(
    error: { code?: string; message: string; status?: number },
    source?: string,
  ): AppError {
    if (error.code === '23505') {
      return new AppError('This item already exists.', 'DUPLICATE', error.status, {}, { source });
    }
    if (error.code === '42501' || error.status === 403) {
      return new AppError(
        'You do not have permission to perform this action.',
        'FORBIDDEN',
        error.status,
        {},
        { source },
      );
    }
    if (error.status === 401) {
      return new AppError(
        'Your session has expired. Please sign in again.',
        'UNAUTHORIZED',
        error.status,
        {},
        { source },
      );
    }
    if (error.status === 429) {
      return new AppError(
        'Too many requests. Please wait a moment and try again.',
        'RATE_LIMITED',
        error.status,
        {},
        { retryable: true, source },
      );
    }
    if (error.status && error.status >= 500) {
      return new AppError(
        'A server error occurred. Please try again.',
        'SERVER_ERROR',
        error.status,
        {},
        { retryable: true, source },
      );
    }
    return new AppError(
      error.message || 'An unexpected error occurred.',
      (error.code as ErrorCode) || 'UNKNOWN',
      error.status,
      {},
      { source },
    );
  }

  static auth(message: string): AppError {
    return new AppError(message, 'AUTH_ERROR', 401, {}, { severity: 'high' });
  }

  static network(): AppError {
    return new AppError(
      'Unable to connect to the server. Check your internet connection.',
      'NETWORK_ERROR',
      0,
      {},
      { retryable: true, severity: 'medium' },
    );
  }

  static validation(message: string, context?: Record<string, unknown>): AppError {
    return new AppError(message, 'VALIDATION_ERROR', 400, context, { severity: 'low' });
  }

  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found.`, 'NOT_FOUND', 404, {}, { severity: 'low' });
  }

  static timeout(source?: string): AppError {
    return new AppError(
      'The request timed out. Please try again.',
      'TIMEOUT',
      408,
      {},
      { retryable: true, source },
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      correlationId: this.correlationId,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      severity: this.severity,
      retryable: this.retryable,
      source: this.source,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

function deriveSeverity(code: string, statusCode?: number): ErrorSeverity {
  if (code === 'UNAUTHORIZED' || code === 'AUTH_ERROR') return 'high';
  if (code === 'FORBIDDEN') return 'medium';
  if (statusCode && statusCode >= 500) return 'high';
  if (code === 'NETWORK_ERROR') return 'medium';
  return 'low';
}

function deriveRetryable(code: string, statusCode?: number): boolean {
  if (code === 'NETWORK_ERROR' || code === 'TIMEOUT' || code === 'RATE_LIMITED') return true;
  if (statusCode && statusCode >= 500) return true;
  return false;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof AppError) return error.retryable;
  return false;
}

/** Structured error logger — swap in any observability provider here. */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof AppError) {
    console.error('[AppError]', error.toJSON(), context ?? {});
  } else if (error instanceof Error) {
    console.error('[Error]', { message: error.message, stack: error.stack }, context ?? {});
  } else {
    console.error('[UnknownError]', error, context ?? {});
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 600,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries && isRetryable(error)) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/** Wraps a promise with a timeout, throwing AppError.timeout() on expiry. */
export function withTimeout<T>(promise: Promise<T>, ms: number, source?: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(AppError.timeout(source)), ms),
    ),
  ]);
}
