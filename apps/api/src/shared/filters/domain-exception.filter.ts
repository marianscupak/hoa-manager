import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { DomainException } from '../errors/domain.exception';
import { ERROR_HTTP_STATUS } from '../errors/error-codes';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(err: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (err instanceof DomainException) {
      const statusCode =
        ERROR_HTTP_STATUS[err.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

      return response.status(statusCode).json({ code: err.code });
    }

    if (err instanceof HttpException) {
      return response.status(err.getStatus()).json(err.getResponse());
    }

    // Unknown error — log it and return a generic 500
    this.logger.error(err, 'UnhandledError');
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ code: 'INTERNAL_SERVER_ERROR' });
  }
}
