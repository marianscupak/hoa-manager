import { HttpStatus } from '@nestjs/common';

/**
 * All domain-level error codes.
 * The frontend translates these codes into user-facing messages.
 */
export const ErrorCode = {
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  REPLAY_ATTACK: 'REPLAY_ATTACK',
  INVITE_NOT_FOUND: 'INVITE_NOT_FOUND',
  INVITE_EXPIRED: 'INVITE_EXPIRED',
  INVITE_ALREADY_ACCEPTED: 'INVITE_ALREADY_ACCEPTED',
  OWNER_ALREADY_CLAIMED: 'OWNER_ALREADY_CLAIMED',
  OWNER_EMAIL_REQUIRED: 'OWNER_EMAIL_REQUIRED',
  EMAIL_MISMATCH: 'EMAIL_MISMATCH',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_EXISTS: 'ACCOUNT_EXISTS',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Maps each error code to its HTTP status code.
 * This is the single place to control what HTTP status each domain error returns.
 */
export const ERROR_HTTP_STATUS: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.USER_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.INVALID_TOKEN]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.REPLAY_ATTACK]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.INVITE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.INVITE_EXPIRED]: HttpStatus.GONE,
  [ErrorCode.INVITE_ALREADY_ACCEPTED]: HttpStatus.CONFLICT,
  [ErrorCode.OWNER_ALREADY_CLAIMED]: HttpStatus.CONFLICT,
  [ErrorCode.OWNER_EMAIL_REQUIRED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.EMAIL_MISMATCH]: HttpStatus.FORBIDDEN,
  [ErrorCode.EMAIL_NOT_VERIFIED]: HttpStatus.FORBIDDEN,
  [ErrorCode.ACCOUNT_EXISTS]: HttpStatus.CONFLICT,
};
