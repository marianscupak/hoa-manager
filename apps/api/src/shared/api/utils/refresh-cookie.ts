import type { Response } from 'express';

const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Sets the refresh_token cookie with consistent options across all auth flows.
 */
export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}
