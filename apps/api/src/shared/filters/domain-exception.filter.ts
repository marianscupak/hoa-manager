import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import { AuthClaims } from '@/shared/domain/auth-claims';
import { TenantContext } from '@/shared/domain/tenant-context';
import { DomainException } from '@/shared/errors/domain.exception';
import { ERROR_HTTP_STATUS } from '@/shared/errors/error-codes';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  catch(err: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & { authClaims?: AuthClaims; tenant?: TenantContext }
    >();

    const requestContext = {
      method: request.method,
      url: request.originalUrl,
      userId: request.authClaims?.sub,
      tenantId: request.tenant?.tenantId,
    };

    if (err instanceof DomainException) {
      const statusCode =
        ERROR_HTTP_STATUS[err.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

      this.logger.warn('DomainException', {
        ...requestContext,
        code: err.code,
        statusCode,
      });

      return response
        .status(statusCode)
        .json({ code: err.code, details: err.details });
    }

    if (err instanceof HttpException) {
      const statusCode = err.getStatus();

      this.logger.warn('HttpException', {
        ...requestContext,
        statusCode,
        message: err.message,
      });

      return response.status(statusCode).json(err.getResponse());
    }

    const stack = err instanceof Error ? err.stack : undefined;
    const message = err instanceof Error ? err.message : String(err);

    this.logger.error('UnhandledError', {
      ...requestContext,
      message,
      stack,
    });

    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ code: 'INTERNAL_SERVER_ERROR' });
  }
}
