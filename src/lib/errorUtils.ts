/**
 * Error Utility Functions
 *
 * Provides user-friendly error messages and standardized error handling
 * for Supabase and general application errors.
 */

// Supabase/PostgreSQL error codes mapped to user-friendly messages
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'invalid_credentials': 'Invalid email or password. Please check your credentials and try again.',
  'email_not_confirmed': 'Please verify your email address before signing in.',
  'user_not_found': 'No account found with this email. Please check your email or sign up.',
  'invalid_grant': 'Your session has expired. Please sign in again.',
  'access_denied': 'You don\'t have permission to perform this action.',

  // Network/Connection errors
  'PGRST301': 'Unable to connect to the server. Please check your internet connection.',
  'FetchError': 'Network error. Please check your internet connection and try again.',
  'NetworkError': 'Unable to reach the server. Please check your connection.',

  // Database constraint errors
  '23505': 'This record already exists. Please use a different value.',
  '23503': 'This operation references data that no longer exists.',
  '23502': 'Required information is missing. Please fill in all required fields.',
  '23514': 'The provided value doesn\'t meet the requirements.',

  // Row Level Security
  '42501': 'You don\'t have permission to access this data.',
  'PGRST116': 'No data found matching your request.',

  // Rate limiting
  '429': 'Too many requests. Please wait a moment before trying again.',
  'over_request_limit': 'Too many requests. Please wait a moment and try again.',

  // Server errors
  '500': 'Server error. Our team has been notified. Please try again later.',
  '503': 'Service temporarily unavailable. Please try again in a few moments.',
};

// Error categories for different handling
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

interface ParsedError {
  message: string;
  category: ErrorCategory;
  originalMessage?: string;
  code?: string;
}

/**
 * Determines the error category from an error object
 */
function categorizeError(error: unknown): ErrorCategory {
  const errorStr = String(error).toLowerCase();
  const errorCode = getErrorCode(error);

  // Network errors
  if (
    errorStr.includes('network') ||
    errorStr.includes('fetch') ||
    errorStr.includes('connection') ||
    errorStr.includes('offline') ||
    errorStr.includes('pgrst301') ||
    errorCode === 'PGRST301'
  ) {
    return ErrorCategory.NETWORK;
  }

  // Auth errors
  if (
    errorStr.includes('auth') ||
    errorStr.includes('credential') ||
    errorStr.includes('sign in') ||
    errorStr.includes('session') ||
    errorStr.includes('token') ||
    errorCode === 'invalid_grant' ||
    errorCode === 'invalid_credentials'
  ) {
    return ErrorCategory.AUTH;
  }

  // Permission errors
  if (
    errorStr.includes('permission') ||
    errorStr.includes('access denied') ||
    errorStr.includes('unauthorized') ||
    errorStr.includes('forbidden') ||
    errorCode === '42501' ||
    errorCode === 'access_denied'
  ) {
    return ErrorCategory.PERMISSION;
  }

  // Not found errors
  if (
    errorStr.includes('not found') ||
    errorStr.includes('no rows') ||
    errorStr.includes('does not exist') ||
    errorCode === 'PGRST116'
  ) {
    return ErrorCategory.NOT_FOUND;
  }

  // Validation errors
  if (
    errorStr.includes('validation') ||
    errorStr.includes('invalid') ||
    errorStr.includes('required') ||
    errorStr.includes('constraint') ||
    errorCode?.startsWith('23')
  ) {
    return ErrorCategory.VALIDATION;
  }

  // Server errors
  if (
    errorStr.includes('500') ||
    errorStr.includes('503') ||
    errorStr.includes('server error') ||
    errorStr.includes('internal')
  ) {
    return ErrorCategory.SERVER;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Extracts error code from various error formats
 */
function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const err = error as Record<string, unknown>;

  // Supabase error format
  if (err.code) return String(err.code);

  // PostgreSQL error format
  if (err.details && typeof err.details === 'object') {
    const details = err.details as Record<string, unknown>;
    if (details.code) return String(details.code);
  }

  // HTTP status code
  if (err.status) return String(err.status);
  if (err.statusCode) return String(err.statusCode);

  return undefined;
}

/**
 * Gets the original error message from various error formats
 */
function getOriginalMessage(error: unknown): string {
  if (!error) return 'Unknown error';

  if (typeof error === 'string') return error;

  if (error instanceof Error) return error.message;

  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (err.message) return String(err.message);
    if (err.error_description) return String(err.error_description);
    if (err.error) return String(err.error);
    if (err.msg) return String(err.msg);
  }

  return String(error);
}

/**
 * Parses any error and returns a user-friendly message with category
 */
export function parseError(error: unknown): ParsedError {
  const code = getErrorCode(error);
  const originalMessage = getOriginalMessage(error);
  const category = categorizeError(error);

  // Check for known error codes
  if (code && SUPABASE_ERROR_MESSAGES[code]) {
    return {
      message: SUPABASE_ERROR_MESSAGES[code],
      category,
      originalMessage,
      code,
    };
  }

  // Provide category-specific fallback messages
  const categoryMessages: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: 'Unable to connect. Please check your internet connection and try again.',
    [ErrorCategory.AUTH]: 'Authentication error. Please sign in again.',
    [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
    [ErrorCategory.PERMISSION]: 'You don\'t have permission to perform this action.',
    [ErrorCategory.NOT_FOUND]: 'The requested item could not be found.',
    [ErrorCategory.SERVER]: 'Server error. Please try again later.',
    [ErrorCategory.UNKNOWN]: 'Something went wrong. Please try again.',
  };

  return {
    message: categoryMessages[category],
    category,
    originalMessage,
    code,
  };
}

/**
 * Gets a user-friendly error message from any error
 */
export function getUserFriendlyError(error: unknown): string {
  return parseError(error).message;
}

/**
 * Gets a contextual error message for specific operations
 */
export function getOperationError(
  error: unknown,
  operation: string,
  context?: string
): string {
  const parsed = parseError(error);

  // For network errors, be specific about retrying
  if (parsed.category === ErrorCategory.NETWORK) {
    return `Could not ${operation}. Please check your internet connection and try again.`;
  }

  // For auth errors, prompt re-authentication
  if (parsed.category === ErrorCategory.AUTH) {
    return `Could not ${operation}. Your session may have expired. Please sign in again.`;
  }

  // For permission errors
  if (parsed.category === ErrorCategory.PERMISSION) {
    return `You don't have permission to ${operation}.`;
  }

  // For not found errors
  if (parsed.category === ErrorCategory.NOT_FOUND) {
    const subject = context || 'The requested item';
    return `${subject} could not be found. It may have been deleted.`;
  }

  // For validation errors
  if (parsed.category === ErrorCategory.VALIDATION) {
    return `Could not ${operation}. Please check your input and try again.`;
  }

  // For server errors
  if (parsed.category === ErrorCategory.SERVER) {
    return `Could not ${operation} due to a server error. Please try again later.`;
  }

  // Default with context
  return context
    ? `Could not ${operation}. ${parsed.message}`
    : `Could not ${operation}. Please try again.`;
}

/**
 * Common operation error messages
 */
export const ErrorMessages = {
  // Game operations
  game: {
    create: (err: unknown) => getOperationError(err, 'create game', 'Make sure all required fields are filled.'),
    delete: (err: unknown) => getOperationError(err, 'delete game', 'The game'),
    load: (err: unknown) => getOperationError(err, 'load game data', 'The game'),
    complete: (err: unknown) => getOperationError(err, 'complete game'),
    update: (err: unknown) => getOperationError(err, 'update game'),
  },

  // Player operations
  player: {
    create: (err: unknown) => getOperationError(err, 'add player'),
    delete: (err: unknown) => getOperationError(err, 'delete player', 'The player'),
    update: (err: unknown) => getOperationError(err, 'update player'),
    addToGame: (err: unknown, name?: string) =>
      getOperationError(err, `add ${name || 'player'} to the game`),
    removeFromGame: (err: unknown, name?: string) =>
      getOperationError(err, `remove ${name || 'player'} from the game`),
  },

  // Buy-in operations
  buyIn: {
    add: (err: unknown) => getOperationError(err, 'add buy-in'),
    update: (err: unknown) => getOperationError(err, 'update buy-ins'),
    delete: (err: unknown) => getOperationError(err, 'delete buy-in'),
  },

  // Final stack operations
  finalStack: {
    update: (err: unknown) => getOperationError(err, 'update final stack'),
    save: (err: unknown) => getOperationError(err, 'save final stack'),
  },

  // Settlement operations
  settlement: {
    confirm: (err: unknown) => getOperationError(err, 'confirm payment'),
    calculate: (err: unknown) => getOperationError(err, 'calculate settlements'),
  },

  // Share operations
  share: {
    generate: (err: unknown) => getOperationError(err, 'generate share link'),
    load: (err: unknown) => getOperationError(err, 'load shared data'),
  },

  // Transfer operations
  transfer: {
    save: (err: unknown) => getOperationError(err, 'save transfer'),
    delete: (err: unknown) => getOperationError(err, 'delete transfer'),
  },

  // Generic
  generic: {
    load: (err: unknown) => getOperationError(err, 'load data'),
    save: (err: unknown) => getOperationError(err, 'save changes'),
    delete: (err: unknown) => getOperationError(err, 'delete item'),
  },
} as const;

/**
 * Checks if an error is an abort error (for cleanup handling)
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('aborted');
  }
  return false;
}
