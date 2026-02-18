/**
 * Environment variable validation
 * Validates required environment variables at application startup
 */

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const;

const optionalEnvVars = [
  'VITE_EVOLUTION_API_URL',
  'VITE_EVOLUTION_API_KEY',
  'VITE_EVOLUTION_INSTANCE_NAME',
  'VITE_SENTRY_DSN',
] as const;

type RequiredEnvVar = typeof requiredEnvVars[number];
type OptionalEnvVar = typeof optionalEnvVars[number];

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates that all required environment variables are set
 * @returns Validation result with missing and warning lists
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of requiredEnvVars) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  // Check optional variables and warn if missing
  for (const key of optionalEnvVars) {
    if (!import.meta.env[key]) {
      warnings.push(`Optional env var ${key} is not set`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validates environment and throws if required vars are missing
 * Call this at application startup
 */
export function assertEnvValid(): void {
  const result = validateEnv();

  if (!result.valid) {
    throw new Error(
      `Missing required environment variables: ${result.missing.join(', ')}\n` +
      'Please check your .env file or deployment configuration.'
    );
  }

  // Log warnings in development only
  if (import.meta.env.DEV && result.warnings.length > 0) {
    console.warn('Environment warnings:', result.warnings);
  }
}

/**
 * Type-safe environment variable getter
 */
export function getEnv(key: RequiredEnvVar): string;
export function getEnv(key: OptionalEnvVar): string | undefined;
export function getEnv(key: RequiredEnvVar | OptionalEnvVar): string | undefined {
  return import.meta.env[key];
}

/**
 * Check if we're in development mode
 */
export const isDev = import.meta.env.DEV;

/**
 * Check if we're in production mode
 */
export const isProd = import.meta.env.PROD;
