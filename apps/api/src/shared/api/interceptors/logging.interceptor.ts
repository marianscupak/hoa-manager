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

import {
  markRequestStart,
  requestDurationMs,
  sanitizeUrl,
  shouldLogRequest,
} from '@/shared/api/logging/request-logging';
import { AuthClaims } from '@/shared/domain/auth-claims';
import { TenantContext } from '@/shared/domain/tenant-context';

/**
 * Writes one line per request.
 *
 * There used to be a second line on the way in, but Caddy already logs every
 * request as it arrives, so the only thing it added here was volume. A failed
 * request is logged by DomainExceptionFilter instead — it is the one that
 * knows the status and the error code, and it reads the start time this
 * interceptor leaves on the request so its line can carry the duration too.
 */
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

    markRequestStart(request);

    if (!shouldLogRequest(originalUrl)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info('RequestCompleted', {
            method,
            path: sanitizeUrl(originalUrl),
            statusCode: response.statusCode,
            durationMs: requestDurationMs(request),
            userId: request.authClaims?.sub,
            tenantId: request.tenant?.tenantId,
          });
        },
      }),
    );
  }
}
