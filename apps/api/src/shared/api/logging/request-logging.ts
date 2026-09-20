import type { Request } from 'express';

/**
 * Paths whose traffic says nothing about how the application is being used.
 *
 * Prometheus scrapes `/api/metrics` every 15 seconds, so the scrape alone
 * accounted for thousands of log lines a day — enough to bury the requests
 * somebody might actually want to find in Loki.
 */
const UNLOGGED_PATHS = ['/api/metrics'];

/**
 * The request path with its query string removed.
 *
 * Two endpoints park a live credential in the query string —
 * `/api/invites/owner/status?token=…` (bearer-equivalent) and
 * `/api/auth/google/callback?code=…` (an OAuth authorization code) — and every
 * logged URL is retained by Loki and readable by anyone with Grafana access.
 * The whole query string goes rather than a list of known-sensitive keys:
 * an allowlist only protects the parameters somebody remembered to name.
 */
export function sanitizeUrl(url: string): string {
  return url.split('?')[0];
}

/** Whether this request is worth a log line. */
export function shouldLogRequest(url: string): boolean {
  return !UNLOGGED_PATHS.includes(sanitizeUrl(url));
}

/**
 * Where the interceptor leaves the start time for the exception filter.
 *
 * A symbol rather than a property name so it cannot collide with anything
 * Express or a middleware puts on the request.
 */
const START_TIME = Symbol('requestLoggingStartTime');

type TimedRequest = Request & { [START_TIME]?: number };

/** Stamps the request so whoever logs it last can report how long it took. */
export function markRequestStart(request: Request, now = Date.now()): void {
  (request as TimedRequest)[START_TIME] = now;
}

/**
 * How long the request has been running, or `undefined` if it was never
 * marked — a request rejected by a guard never reaches the interceptor.
 */
export function requestDurationMs(
  request: Request,
  now = Date.now(),
): number | undefined {
  const start = (request as TimedRequest)[START_TIME];
  return start === undefined ? undefined : now - start;
}
