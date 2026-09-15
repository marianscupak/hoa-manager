import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditModule } from '@/modules/core/audit/audit.module';
import { AuditProjectionsModule } from '@/modules/core/audit-projections/audit-projections.module';
import { AuthModule } from '@/modules/core/auth/auth.module';
import { IdentityModule } from '@/modules/core/identity/identity.module';
import { InvitationModule } from '@/modules/core/invitation/invitation.module';
import { KatastrImportController } from '@/modules/core/property/api/katastr-import.controller';
import { OwnerController } from '@/modules/core/property/api/owner.controller';
import { PropertyController } from '@/modules/core/property/api/property.controller';
import { UnitController } from '@/modules/core/property/api/unit.controller';
import { CancelScheduledOwnershipTransferHandler } from '@/modules/core/property/application/handlers/cancel-scheduled-ownership-transfer.handler';
import { CreateOwnerHandler } from '@/modules/core/property/application/handlers/create-owner.handler';
import { CreateUnitHandler } from '@/modules/core/property/application/handlers/create-unit.handler';
import { DeleteOwnerHandler } from '@/modules/core/property/application/handlers/delete-owner.handler';
import { DeleteUnitHandler } from '@/modules/core/property/application/handlers/delete-unit.handler';
import { GetOwnerByIdHandler } from '@/modules/core/property/application/handlers/get-owner-by-id.handler';
import { GetUnitDetailHandler } from '@/modules/core/property/application/handlers/get-unit-detail.handler';
import { GetUnitOwnershipHistoryHandler } from '@/modules/core/property/application/handlers/get-unit-ownership-history.handler';
import { ImportKatastrDataHandler } from '@/modules/core/property/application/handlers/import-katastr-data.handler';
import { ListOwnersHandler } from '@/modules/core/property/application/handlers/list-owners.handler';
import { ListUnitsHandler } from '@/modules/core/property/application/handlers/list-units.handler';
import { PreviewKatastrImportHandler } from '@/modules/core/property/application/handlers/preview-katastr-import.handler';
import { ReplaceUnitOwnershipHandler } from '@/modules/core/property/application/handlers/replace-unit-ownership.handler';
import { SetOwnerEmailHandler } from '@/modules/core/property/application/handlers/set-owner-email.handler';
import { SetOwnerUserIdHandler } from '@/modules/core/property/application/handlers/set-owner-user-id.handler';
import { UpdateUnitHandler } from '@/modules/core/property/application/handlers/update-unit.handler';
import { KATASTR_SNAPSHOT_REPOSITORY } from '@/modules/core/property/application/ports/katastr-snapshot.repository.port';
import { OWNER_READ_REPOSITORY } from '@/modules/core/property/application/ports/owner-read.repository.port';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
} from '@/modules/core/property/application/ports/property.repository.port';
import { UNIT_READ_REPOSITORY } from '@/modules/core/property/application/ports/unit-read.repository.port';
import { GetOwnedUnitsHandler } from '@/modules/core/property/application/queries/get-owned-units/get-owned-units.handler';
import { GetPropertyOverviewHandler } from '@/modules/core/property/application/queries/get-property-overview/get-property-overview.handler';
import { PropertyAuditRegistration } from '@/modules/core/property/audit/property-audit.registration';
import { DrizzleKatastrSnapshotRepository } from '@/modules/core/property/infrastructure/persistence/drizzle-katastr-snapshot.repository';
import { DrizzleOwnerReadRepository } from '@/modules/core/property/infrastructure/persistence/drizzle-owner-read.repository';
import {
  DrizzleOwnerRepository,
  DrizzleUnitOwnershipRepository,
  DrizzleUnitRepository,
} from '@/modules/core/property/infrastructure/persistence/drizzle-property.repository';
import { DrizzleUnitReadRepository } from '@/modules/core/property/infrastructure/persistence/drizzle-unit-read.repository';
import { TenancyModule } from '@/modules/core/tenancy/tenancy.module';

const CommandHandlers = [
  CreateOwnerHandler,
  CreateUnitHandler,
  ReplaceUnitOwnershipHandler,
  CancelScheduledOwnershipTransferHandler,
  SetOwnerEmailHandler,
  SetOwnerUserIdHandler,
  UpdateUnitHandler,
  DeleteUnitHandler,
  DeleteOwnerHandler,
  ImportKatastrDataHandler,
];

const QueryHandlers = [
  ListOwnersHandler,
  ListUnitsHandler,
  GetUnitDetailHandler,
  GetUnitOwnershipHistoryHandler,
  GetOwnerByIdHandler,
  GetPropertyOverviewHandler,
  GetOwnedUnitsHandler,
  PreviewKatastrImportHandler,
];

const Repositories = [
  { provide: UNIT_REPOSITORY, useClass: DrizzleUnitRepository },
  { provide: OWNER_REPOSITORY, useClass: DrizzleOwnerRepository },
  {
    provide: UNIT_OWNERSHIP_REPOSITORY,
    useClass: DrizzleUnitOwnershipRepository,
  },
  { provide: UNIT_READ_REPOSITORY, useClass: DrizzleUnitReadRepository },
  { provide: OWNER_READ_REPOSITORY, useClass: DrizzleOwnerReadRepository },
  {
    provide: KATASTR_SNAPSHOT_REPOSITORY,
    useClass: DrizzleKatastrSnapshotRepository,
  },
  DrizzleUnitOfWork,
];

@Module({
  imports: [
    CqrsModule,
    IdentityModule,
    TenancyModule,
    AuthModule,
    AuditModule,
    AuditProjectionsModule,
    forwardRef(() => InvitationModule),
  ],
  controllers: [
    OwnerController,
    PropertyController,
    UnitController,
    KatastrImportController,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Repositories,
    PropertyAuditRegistration,
  ],
  exports: [],
})
export class PropertyModule {}
