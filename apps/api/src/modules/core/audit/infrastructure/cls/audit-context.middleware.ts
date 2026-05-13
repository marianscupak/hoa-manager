import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

import { AUDIT_CLS_KEYS } from './audit-context.keys';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    this.cls.set(AUDIT_CLS_KEYS.ipAddress, req.ip ?? null);
    this.cls.set(AUDIT_CLS_KEYS.userAgent, req.headers['user-agent'] ?? null);
    next();
  }
}
