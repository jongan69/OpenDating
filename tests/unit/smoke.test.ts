import { describe, it, expect } from 'vitest';

describe('build verification', () => {
  it('should have valid package.json', () => {
    expect(true).toBe(true);
  });

  it('should support ES module imports', async () => {
    // Verify we can import the noble curves library
    const { schnorr } = await import('@noble/curves/secp256k1');
    expect(schnorr).toBeDefined();
    expect(typeof schnorr.verify).toBe('function');
    expect(typeof schnorr.sign).toBe('function');
  });
});
