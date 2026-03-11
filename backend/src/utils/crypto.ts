import { createHash, randomBytes, randomInt } from 'node:crypto';

/**
 * Small crypto helpers. We hash anything sensitive that we must persist
 * (refresh tokens, OTP codes) with SHA-256 so a database leak cannot be
 * replayed — the raw value never touches disk.
 */

/** SHA-256 hex digest — used for refresh-token and OTP storage. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Cryptographically strong opaque token (for refresh tokens). */
export function randomToken(bytes = 48): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Numeric OTP of the given length using a uniform, unbiased RNG.
 * Leading zeros are preserved (returned as a string).
 */
export function generateOtp(length: number): string {
  let code = '';
  for (let i = 0; i < length; i += 1) code += randomInt(0, 10).toString();
  return code;
}
