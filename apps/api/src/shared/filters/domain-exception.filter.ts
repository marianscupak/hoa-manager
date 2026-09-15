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

    // Multer rejects an oversized or unexpectedly-shaped upload with a plain
    // error carrying a `code`, not an HttpException, so without this it would
    // fall through to the generic 500 below. Matched on the shape rather than
    // on `MulterError`, which pnpm's strict layout does not expose to callers
    // of `@nestjs/platform-express` (it is a transitive dependency, not a
    // direct one). Any controller using `FileInterceptor` benefits from this,
    // not just katastr import, so the codes are neutral rather than feature-
    // specific.
    const multerCode = (err as { code?: unknown } | null)?.code;
    if (multerCode === 'LIMIT_FILE_SIZE') {
      this.logger.warn('UploadRejected', {
        ...requestContext,
        code: 'FILE_TOO_LARGE',
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      });
      return response
        .status(HttpStatus.PAYLOAD_TOO_LARGE)
        .json({ code: 'FILE_TOO_LARGE' });
    }
    if (multerCode === 'LIMIT_UNEXPECTED_FILE') {
      this.logger.warn('UploadRejected', {
        ...requestContext,
        code: 'UNEXPECTED_FILE',
        statusCode: HttpStatus.BAD_REQUEST,
      });
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ code: 'UNEXPECTED_FILE' });
    }

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
