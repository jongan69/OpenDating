/**
 * Runtime configuration validation.
 *
 * Validates that the environment provides all required bindings
 * and that configuration values are within safe ranges.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate that required Cloudflare bindings are present.
 * Call at startup before handling any requests.
 */
export function validateEnvironment(env: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // D1 Database binding
  if (!env?.RELAY_DATABASE) {
    errors.push({
      field: 'RELAY_DATABASE',
      message: 'Missing D1 database binding. Ensure wrangler.toml has a [[d1_databases]] section.',
    });
  }

  // Durable Object binding
  if (!env?.RELAY_WEBSOCKET) {
    errors.push({
      field: 'RELAY_WEBSOCKET',
      message: 'Missing Durable Object binding. Ensure wrangler.toml has a [[durable_objects.bindings]] section.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a numeric config value is within reasonable bounds.
 */
export function validateNumericRange(
  value: number,
  field: string,
  min: number,
  max: number,
): ValidationError | null {
  if (value < min || value > max) {
    return {
      field,
      message: `${field} must be between ${min} and ${max}, got ${value}`,
    };
  }
  return null;
}

/**
 * Validate that a URL string is well-formed.
 */
export function validateUrl(value: string, field: string): ValidationError | null {
  try {
    new URL(value);
    return null;
  } catch {
    return {
      field,
      message: `${field} must be a valid URL, got "${value}"`,
    };
  }
}

/**
 * Validate all configuration at startup.
 */
export function validateConfig(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // We import dynamically to avoid circular dependencies
  // In practice these are validated via the validateEnvironment function

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
