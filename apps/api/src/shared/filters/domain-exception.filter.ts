import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import { DomainException } from '../errors/domain.exception';
import { ERROR_HTTP_STATUS } from '../errors/error-codes';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  catch(err: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (err instanceof DomainException) {
      const statusCode =
        ERROR_HTTP_STATUS[err.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

      this.logger.warn('DomainException', { code: err.code, statusCode });

      return response.status(statusCode).json({ code: err.code });
    }

    if (err instanceof HttpException) {
      return response.status(err.getStatus()).json(err.getResponse());
    }

    this.logger.error('UnhandledError', { error: err });
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ code: 'INTERNAL_SERVER_ERROR' });
  }
}
