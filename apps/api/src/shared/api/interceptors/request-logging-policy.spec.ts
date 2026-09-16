import { shouldLogRequest } from '@/shared/api/interceptors/request-logging-policy';

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
