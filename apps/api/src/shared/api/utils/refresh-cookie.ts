import type { Response } from 'express';

const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Cookies are marked Secure everywhere except local development.
// An unset NODE_ENV is treated as a non-local environment (defaults to secure).
const isCookieSecure = () => process.env.NODE_ENV !== 'development';

/**
 * Sets the refresh_token cookie with consistent options across all auth flows.
 */
export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: 'strict',
  });
}
