import { type ErrorCode } from '@/shared/errors/error-codes';

/**
 * Base class for all domain exceptions.
 * Carries a typed error code — no human-readable message.
 * The global DomainExceptionFilter maps this to an HTTP response.
 */
export class DomainException extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
    this.name = 'DomainException';
  }
}
