import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { EmailModule } from '@/infrastructure/email/email.module';
import { AuditModule } from '@/modules/core/audit/audit.module';
import { AuditProjectionsModule } from '@/modules/core/audit-projections/audit-projections.module';
import { AuthModule } from '@/modules/core/auth/auth.module';
import { IdentityModule } from '@/modules/core/identity/identity.module';
import { InviteController } from '@/modules/core/property/api/invite.controller';
import { KatastrImportController } from '@/modules/core/property/api/katastr-import.controller';
import { OwnerController } from '@/modules/core/property/api/owner.controller';
import { PeopleController } from '@/modules/core/property/api/people.controller';
import { PropertyController } from '@/modules/core/property/api/property.controller';
import { UnitController } from '@/modules/core/property/api/unit.controller';
import { AcceptOwnerInviteHandler } from '@/modules/core/property/application/handlers/accept-owner-invite.handler';
import { CancelScheduledOwnershipTransferHandler } from '@/modules/core/property/application/handlers/cancel-scheduled-ownership-transfer.handler';
import { CreateOwnerHandler } from '@/modules/core/property/application/handlers/create-owner.handler';
import { CreateUnitHandler } from '@/modules/core/property/application/handlers/create-unit.handler';
import { DeleteOwnerHandler } from '@/modules/core/property/application/handlers/delete-owner.handler';
import { DeleteUnitHandler } from '@/modules/core/property/application/handlers/delete-unit.handler';
import { GetOwnerByIdHandler } from '@/modules/core/property/application/handlers/get-owner-by-id.handler';
import { GetOwnerInviteStatusHandler } from '@/modules/core/property/application/handlers/get-owner-invite-status.handler';
import { GetPendingInviteByOwnerIdHandler } from '@/modules/core/property/application/handlers/get-pending-invite-by-owner-id.handler';
import { GetUnitDetailHandler } from '@/modules/core/property/application/handlers/get-unit-detail.handler';
import { GetUnitOwnershipHistoryHandler } from '@/modules/core/property/application/handlers/get-unit-ownership-history.handler';
import { ImportKatastrDataHandler } from '@/modules/core/property/application/handlers/import-katastr-data.handler';
import { LinkOwnerToAccountHandler } from '@/modules/core/property/application/handlers/link-owner-to-account.handler';
import { ListOwnersHandler } from '@/modules/core/property/application/handlers/list-owners.handler';
import { ListPeopleHandler } from '@/modules/core/property/application/handlers/list-people.handler';
import { ListUnitsHandler } from '@/modules/core/property/application/handlers/list-units.handler';
import { PreviewKatastrImportHandler } from '@/modules/core/property/application/handlers/preview-katastr-import.handler';
import { RegisterFromInviteHandler } from '@/modules/core/property/application/handlers/register-from-invite.handler';
import { RenameOwnerHandler } from '@/modules/core/property/application/handlers/rename-owner.handler';
import { ReplaceUnitOwnershipHandler } from '@/modules/core/property/application/handlers/replace-unit-ownership.handler';
import { RevokeOwnerInviteHandler } from '@/modules/core/property/application/handlers/revoke-owner-invite.handler';
import { SendOwnerInviteHandler } from '@/modules/core/property/application/handlers/send-owner-invite.handler';
import { SetOwnerEmailHandler } from '@/modules/core/property/application/handlers/set-owner-email.handler';
import { SetOwnerUserIdHandler } from '@/modules/core/property/application/handlers/set-owner-user-id.handler';
import { UnlinkOwnerFromAccountHandler } from '@/modules/core/property/application/handlers/unlink-owner-from-account.handler';
import { UpdateOwnershipPeriodHandler } from '@/modules/core/property/application/handlers/update-ownership-period.handler';
import { UpdateUnitHandler } from '@/modules/core/property/application/handlers/update-unit.handler';
import { INVITE_READ_REPOSITORY } from '@/modules/core/property/application/ports/invite-read.repository.port';
import { KATASTR_SNAPSHOT_REPOSITORY } from '@/modules/core/property/application/ports/katastr-snapshot.repository.port';
import { OWNER_INVITE_REPOSITORY } from '@/modules/core/property/application/ports/owner-invite.repository.port';
import { OWNER_READ_REPOSITORY } from '@/modules/core/property/application/ports/owner-read.repository.port';
import { PEOPLE_HOLDINGS_REPOSITORY } from '@/modules/core/property/application/ports/people-holdings.repository.port';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
} from '@/modules/core/property/application/ports/property.repository.port';
import { UNIT_READ_REPOSITORY } from '@/modules/core/property/application/ports/unit-read.repository.port';
import { GetOwnedUnitsHandler } from '@/modules/core/property/application/queries/get-owned-units/get-owned-units.handler';
import { GetPropertyOverviewHandler } from '@/modules/core/property/application/queries/get-property-overview/get-property-overview.handler';
import { PropertyAuditRegistration } from '@/modules/core/property/audit/property-audit.registration';
import { DrizzleInviteReadRepository } from '@/modules/core/property/infrastructure/persistence/drizzle-invite-read.repository';
import { DrizzleKatastrSnapshotRepository } from '@/modules/core/property/infrastructure/persistence/drizzle-katastr-snapshot.repository';
import { DrizzleOwnerInviteRepository } from '@/modules/core/property/infrastructure/persistence/drizzle-owner-invite.repository';
import { DrizzleOwnerReadRepository } from '@/modules/core/property/infrastructure/persistence/drizzle-owner-read.repository';
import { DrizzlePeopleHoldingsRepository } from '@/modules/core/property/infrastructure/persistence/drizzle-people-holdings.repository';
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
  RenameOwnerHandler,
  UpdateOwnershipPeriodHandler,
  SetOwnerEmailHandler,
  SetOwnerUserIdHandler,
  LinkOwnerToAccountHandler,
  UnlinkOwnerFromAccountHandler,
  UpdateUnitHandler,
  DeleteUnitHandler,
  DeleteOwnerHandler,
  ImportKatastrDataHandler,
  SendOwnerInviteHandler,
  AcceptOwnerInviteHandler,
  RegisterFromInviteHandler,
  RevokeOwnerInviteHandler,
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
  GetOwnerInviteStatusHandler,
  GetPendingInviteByOwnerIdHandler,
  ListPeopleHandler,
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
  { provide: OWNER_INVITE_REPOSITORY, useClass: DrizzleOwnerInviteRepository },
  { provide: INVITE_READ_REPOSITORY, useClass: DrizzleInviteReadRepository },
  {
    provide: PEOPLE_HOLDINGS_REPOSITORY,
    useClass: DrizzlePeopleHoldingsRepository,
  },
];

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    EmailModule,
    IdentityModule,
    TenancyModule,
    AuthModule,
    AuditModule,
    AuditProjectionsModule,
  ],
  controllers: [
    OwnerController,
    PropertyController,
    UnitController,
    KatastrImportController,
    InviteController,
    PeopleController,
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
