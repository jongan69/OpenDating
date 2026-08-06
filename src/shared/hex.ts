/**
 * Hex encoding/decoding utilities.
 */

/**
 * Convert a hex string to Uint8Array.
 */
export function hexToBytes(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
