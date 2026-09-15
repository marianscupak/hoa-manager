import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

import { UnitNotFoundException } from '@/shared/application/exceptions/property.exceptions';
import { DomainExceptionFilter } from '@/shared/filters/domain-exception.filter';

function fakeHost(): {
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
  const request = { method: 'POST', originalUrl: '/api/whatever' };
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
});
