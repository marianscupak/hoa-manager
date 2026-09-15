/**
 * Endpoints that authenticate a caller rather than trust an access token.
 * A 401 from one of these means the supplied credentials or cookie were
 * rejected — there is nothing to refresh, and retrying replaces the real
 * error (`INVALID_CREDENTIALS`) with the refresh endpoint's `UNAUTHORIZED`
 * before the caller ever sees it.
 *
 * `switch-tenant` is deliberately absent: it carries `AccessTokenAuthGuard`,
 * so its 401 really can mean an expired token.
 */
const NO_REFRESH_PATHS = [
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/google/exchange",
    "/api/auth/logout",
];

/**
 * Whether a 401 from this request should be retried behind a token refresh.
 * Defaults to true for anything unrecognised, so a protected request never
 * loses its silent re-authentication.
 */
export function shouldAttemptRefresh(url: string | undefined): boolean {
    if (!url) return true;
    const path = url.split("?")[0];
    return !NO_REFRESH_PATHS.includes(path);
}
