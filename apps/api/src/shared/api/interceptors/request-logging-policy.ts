/**
 * Paths whose traffic says nothing about how the application is being used.
 *
 * Prometheus scrapes `/api/metrics` every 15 seconds and the logging
 * interceptor writes two lines per request, so the scrape alone accounted for
 * roughly eleven thousand log lines a day — enough to bury the requests
 * somebody might actually want to find in Loki.
 */
const UNLOGGED_PATHS = ['/api/metrics'];

/** Whether this request is worth a pair of log lines. */
export function shouldLogRequest(url: string): boolean {
  const path = url.split('?')[0];
  return !UNLOGGED_PATHS.includes(path);
}
