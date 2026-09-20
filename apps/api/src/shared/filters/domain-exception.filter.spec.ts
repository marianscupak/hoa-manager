import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

import { UnitNotFoundException } from '@/shared/application/exceptions/property.exceptions';
import { DomainExceptionFilter } from '@/shared/filters/domain-exception.filter';

function fakeHost(originalUrl = '/api/whatever'): {
  host: ArgumentsHost;
  sent: { status?: number; body?: unknown };
} {
  const sent: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: unknown) {
      sent.body = body;
      return this;
    },
  };
  const request = { method: 'POST', originalUrl };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, sent };
}

describe('DomainExceptionFilter', () => {
  const logger = { warn: jest.fn(), error: jest.fn() } as never;
  const filter = new DomainExceptionFilter(logger);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps the multer size-limit error to 413, not the generic 500', () => {
    const { host, sent } = fakeHost();
    filter.catch({ code: 'LIMIT_FILE_SIZE' }, host);
    expect(sent.status).toBe(413);
    expect(sent.body).toEqual({ code: 'FILE_TOO_LARGE' });
  });

  it('maps the multer unexpected-file error to 400', () => {
    const { host, sent } = fakeHost();
    filter.catch({ code: 'LIMIT_UNEXPECTED_FILE' }, host);
    expect(sent.status).toBe(400);
    expect(sent.body).toEqual({ code: 'UNEXPECTED_FILE' });
  });

  // This is the assertion that would have caught the controller-scoped
  // UploadLimitFilter shadowing the global filter: a DomainException must
  // keep its own mapped status, not fall through to a filter that has never
  // heard of ERROR_HTTP_STATUS.
  it('maps a DomainException to its own status, not a generic 500', () => {
    const { host, sent } = fakeHost();
    filter.catch(new UnitNotFoundException(), host);
    expect(sent.status).toBe(404);
    expect(sent.body).toEqual({ code: 'UNIT_NOT_FOUND', details: undefined });
  });

  it('keeps an HttpException on its own status and body', () => {
    const { host, sent } = fakeHost();
    filter.catch(new BadRequestException({ code: 'SOMETHING' }), host);
    expect(sent.status).toBe(400);
    expect(sent.body).toEqual({ code: 'SOMETHING' });
  });

  it('falls back to 500 only for a truly unknown error', () => {
    const { host, sent } = fakeHost();
    filter.catch(new Error('database is down'), host);
    expect(sent.status).toBe(500);
    expect(sent.body).toEqual({ code: 'INTERNAL_SERVER_ERROR' });
  });

  // Loki keeps whatever this filter writes for a month, behind a Grafana any
  // admin can reach, so a credential in the query string must not get there.
  it('logs the path without the invite token', () => {
    const { host } = fakeHost('/api/invites/owner/status?token=super-secret');
    filter.catch(new UnitNotFoundException(), host);
    const [, meta] = (logger as unknown as { warn: jest.Mock }).warn.mock
      .calls[0];
    expect(meta.path).toBe('/api/invites/owner/status');
    expect(JSON.stringify(meta)).not.toContain('super-secret');
  });

  // Winston splices a meta key called `message` onto the primary message, so
  // passing the error text under that name turned the event name into
  // "HttpException Cannot GET /api/nope" and there was nothing stable left to
  // filter on in Loki. The error text belongs in its own field.
  it.each([
    ['warn', new BadRequestException('Cannot GET /api/nope')],
    ['error', new Error('database is down')],
  ])('keeps the %s event name free of the error text', (level, thrown) => {
    const { host } = fakeHost();
    filter.catch(thrown, host);
    const mock = (logger as unknown as Record<string, jest.Mock>)[level];
    const [event, meta] = mock.mock.calls[0];
    expect(event).not.toContain('database is down');
    expect(event).not.toContain('Cannot GET');
    expect(meta).not.toHaveProperty('message');
    expect(meta.error).toBeDefined();
  });

  it('logs the path without the OAuth authorization code', () => {
    const { host } = fakeHost('/api/auth/google/callback?code=4/0Ax&state=xyz');
    filter.catch(new Error('token exchange failed'), host);
    const [, meta] = (logger as unknown as { error: jest.Mock }).error.mock
      .calls[0];
    expect(meta.path).toBe('/api/auth/google/callback');
    expect(JSON.stringify(meta)).not.toContain('4/0Ax');
  });
});
