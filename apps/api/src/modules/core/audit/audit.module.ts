import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth/auth.module';

import { AuditController } from './api/audit.controller';
import { AUDIT_EVENT_READ_REPOSITORY } from './application/ports/audit-event-read.repository.port';
import { AUDIT_EVENT_WRITE_REPOSITORY } from './application/ports/audit-event-write.repository.port';
import { GetTenantActivityHandler } from './application/queries/get-tenant-activity/get-tenant-activity.handler';
import { AuditEventRegistry } from './application/registry/audit-event.registry';
import { AuditContextService } from './application/services/audit-context.service';
import { AuditFormatterRegistry } from './application/services/audit-formatter-registry';
import { AuditService } from './application/services/audit.service';
import { VisibilityPolicyService } from './application/services/visibility-policy.service';
import { AuditContextMiddleware } from './infrastructure/cls/audit-context.middleware';
import { SystemActorRunner } from './infrastructure/cls/system-actor.runner';
import { DrizzleAuditEventReadRepository } from './infrastructure/persistence/drizzle-audit-event-read.repository';
import { DrizzleAuditEventWriteRepository } from './infrastructure/persistence/drizzle-audit-event-write.repository';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [AuditController],
  providers: [
    AuditEventRegistry,
    AuditService,
    AuditContextService,
    VisibilityPolicyService,
    AuditFormatterRegistry,
    SystemActorRunner,
    GetTenantActivityHandler,
    {
      provide: AUDIT_EVENT_WRITE_REPOSITORY,
      useClass: DrizzleAuditEventWriteRepository,
    },
    {
      provide: AUDIT_EVENT_READ_REPOSITORY,
      useClass: DrizzleAuditEventReadRepository,
    },
  ],
  exports: [
    AuditService,
    AuditContextService,
    VisibilityPolicyService,
    AuditFormatterRegistry,
    SystemActorRunner,
    AuditEventRegistry,
    AUDIT_EVENT_READ_REPOSITORY,
  ],
})
export class AuditModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
