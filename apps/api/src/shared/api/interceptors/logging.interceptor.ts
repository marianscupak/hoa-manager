import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable, tap } from 'rxjs';
import type { Logger as WinstonLogger } from 'winston';

import { shouldLogRequest } from '@/shared/api/interceptors/request-logging-policy';
import { AuthClaims } from '@/shared/domain/auth-claims';
import { TenantContext } from '@/shared/domain/tenant-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<
      Request & { authClaims?: AuthClaims; tenant?: TenantContext }
    >();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl } = request;

    if (!shouldLogRequest(originalUrl)) {
      return next.handle();
    }

    const userId = request.authClaims?.sub;
    const tenantId = request.tenant?.tenantId;
    const start = Date.now();

    this.logger.info('Incoming request', {
      method,
      url: originalUrl,
      userId,
      tenantId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.info('Request completed', {
            method,
            url: originalUrl,
            userId,
            tenantId,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
          });
        },
        error: () => {
          const duration = Date.now() - start;
          this.logger.warn('Request failed', {
            method,
            url: originalUrl,
            userId,
            tenantId,
            duration: `${duration}ms`,
          });
        },
      }),
    );
  }
}
