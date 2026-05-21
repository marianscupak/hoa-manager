import { Module, forwardRef } from '@nestjs/common';

import { AuditModule } from '@/modules/core/audit/audit.module';

import { CoreAuditFormatter } from './core-audit-formatter';
import { CoreAuditLabelResolver } from './core-audit-label-resolver.service';

@Module({
  imports: [forwardRef(() => AuditModule)],
  providers: [CoreAuditFormatter, CoreAuditLabelResolver],
  exports: [CoreAuditLabelResolver],
})
export class AuditProjectionsModule {}
