import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AUDIT_EVENT_READ_REPOSITORY } from './application/ports/audit-event-read.repository.port';
import { AUDIT_EVENT_WRITE_REPOSITORY } from './application/ports/audit-event-write.repository.port';
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
  providers: [
    AuditEventRegistry,
    AuditService,
    AuditContextService,
    VisibilityPolicyService,
    AuditFormatterRegistry,
    SystemActorRunner,
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
