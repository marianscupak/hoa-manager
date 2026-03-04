import { createHash, randomBytes } from 'crypto';

/**
 * Hashes a raw token using SHA-256.
 * Used for invite tokens and any other opaque bearer tokens
 * where we store only the hash and never the raw value.
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a cryptographically random hex token.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
