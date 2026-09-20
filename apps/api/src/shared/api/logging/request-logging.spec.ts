import type { Request } from 'express';

import {
  markRequestStart,
  requestDurationMs,
  sanitizeUrl,
  shouldLogRequest,
} from '@/shared/api/logging/request-logging';

describe('shouldLogRequest', () => {
  it('skips the Prometheus scrape', () => {
    // Prometheus scrapes every 15s and the interceptor writes two lines per
    // request, so this alone pushed ~11k lines a day into Loki.
    expect(shouldLogRequest('/api/metrics')).toBe(false);
  });

  it('skips the scrape even with a query string', () => {
    expect(shouldLogRequest('/api/metrics?foo=bar')).toBe(false);
  });

  it('logs the health check, which is rare and worth seeing', () => {
    expect(shouldLogRequest('/api/health')).toBe(true);
  });

  it('logs ordinary requests', () => {
    expect(shouldLogRequest('/api/votes/abc-123')).toBe(true);
    expect(shouldLogRequest('/api/auth/login')).toBe(true);
  });

  it('does not skip a path that merely ends in the scrape path', () => {
    expect(shouldLogRequest('/api/votes/metrics')).toBe(true);
  });
});

describe('sanitizeUrl', () => {
  it('leaves a query-less URL alone', () => {
    expect(sanitizeUrl('/api/votes/abc-123')).toBe('/api/votes/abc-123');
  });

  // The two that make this a security fix rather than tidiness: both carry a
  // live credential in the query string, and both were being written to Loki
  // two or three times per request.
  it('drops the invite token', () => {
    expect(sanitizeUrl('/api/invites/owner/status?token=super-secret')).toBe(
      '/api/invites/owner/status',
    );
  });

  it('drops the Google authorization code and state', () => {
    expect(
      sanitizeUrl(
        '/api/auth/google/callback?code=4/0Ax&state=xyz&iss=accounts',
      ),
    ).toBe('/api/auth/google/callback');
  });

  it('drops harmless query parameters too', () => {
    // Default-deny: an allowlist would leak the next secret somebody adds.
    expect(sanitizeUrl('/api/votes?status=OPEN&limit=10')).toBe('/api/votes');
  });

  it('keeps an empty query string from leaving a trailing marker', () => {
    expect(sanitizeUrl('/api/votes?')).toBe('/api/votes');
  });

  it('survives a URL that is nothing but a query string', () => {
    expect(sanitizeUrl('?token=secret')).toBe('');
  });
});

describe('request timing', () => {
  const fakeRequest = () => ({}) as Request;

  it('reports nothing before the request has been marked', () => {
    expect(requestDurationMs(fakeRequest(), 1_000)).toBeUndefined();
  });

  it('measures from the mark to the moment asked for', () => {
    const request = fakeRequest();
    markRequestStart(request, 1_000);
    expect(requestDurationMs(request, 1_042)).toBe(42);
  });

  // The filter reads the mark the interceptor left, so both must agree on the
  // same request object even though neither imports the other.
  it('is readable more than once', () => {
    const request = fakeRequest();
    markRequestStart(request, 1_000);
    expect(requestDurationMs(request, 1_010)).toBe(10);
    expect(requestDurationMs(request, 1_020)).toBe(20);
  });
});
