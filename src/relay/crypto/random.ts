/**
 * Cryptographically secure random value generation.
 */

/**
 * Generate a cryptographically secure random hex string.
 * Uses Web Crypto API (available in Cloudflare Workers).
 */
export function randomHex(bytes: number = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random integer in [min, max] (inclusive).
 */
export function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0]! % range);
}

/**
 * Generate a UUID v4 using crypto.randomUUID().
 */
export function uuid(): string {
  return crypto.randomUUID();
}
