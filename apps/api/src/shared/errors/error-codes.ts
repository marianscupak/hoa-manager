import { HttpStatus } from '@nestjs/common';

/**
 * All domain-level error codes.
 * The frontend translates these codes into user-facing messages.
 */
export const ErrorCode = {
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Maps each error code to its HTTP status code.
 * This is the single place to control what HTTP status each domain error returns.
 */
export const ERROR_HTTP_STATUS: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.USER_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
};
