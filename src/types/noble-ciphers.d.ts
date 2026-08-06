/**
 * Type declarations for @noble/ciphers subpath imports.
 * These modules exist but aren't in the package.json exports map.
 */
declare module '@noble/ciphers/chacha.js' {
  export const chacha20: (key: Uint8Array, nonce: Uint8Array, data: Uint8Array, output?: Uint8Array, counter?: number) => Uint8Array;
  export const xchacha20: (key: Uint8Array, nonce: Uint8Array, data: Uint8Array) => Uint8Array;
}

declare module '@noble/ciphers/utils.js' {
  export const randomBytes: (len: number) => Uint8Array;
}

declare module '@noble/ciphers/utils' {
  export const randomBytes: (len: number) => Uint8Array;
}
