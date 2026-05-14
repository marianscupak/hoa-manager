import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuthModule } from '@/modules/core/auth/auth.module';
import { IdentityModule } from '@/modules/core/identity/identity.module';
import { InvitationModule } from '@/modules/core/invitation/invitation.module';
import { OwnerController } from '@/modules/core/property/api/owner.controller';
import { PropertyController } from '@/modules/core/property/api/property.controller';
import { UnitController } from '@/modules/core/property/api/unit.controller';
import { CreateOwnerHandler } from '@/modules/core/property/application/handlers/create-owner.handler';
import { CreateUnitHandler } from '@/modules/core/property/application/handlers/create-unit.handler';
import { DeleteOwnerHandler } from '@/modules/core/property/application/handlers/delete-owner.handler';
import { DeleteUnitHandler } from '@/modules/core/property/application/handlers/delete-unit.handler';
import { GetOwnerByIdHandler } from '@/modules/core/property/application/handlers/get-owner-by-id.handler';
import { GetUnitDetailHandler } from '@/modules/core/property/application/handlers/get-unit-detail.handler';
import { ListOwnersHandler } from '@/modules/core/property/application/handlers/list-owners.handler';
import { ListUnitsHandler } from '@/modules/core/property/application/handlers/list-units.handler';
import { ReplaceUnitOwnershipHandler } from '@/modules/core/property/application/handlers/replace-unit-ownership.handler';
import { SetOwnerUserIdHandler } from '@/modules/core/property/application/handlers/set-owner-user-id.handler';
import { UpdateUnitHandler } from '@/modules/core/property/application/handlers/update-unit.handler';
import { OWNER_READ_REPOSITORY } from '@/modules/core/property/application/ports/owner-read.repository.port';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
} from '@/modules/core/property/application/ports/property.repository.port';
import { UNIT_READ_REPOSITORY } from '@/modules/core/property/application/ports/unit-read.repository.port';
import { GetPropertyOverviewHandler } from '@/modules/core/property/application/queries/get-property-overview/get-property-overview.handler';
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
  SetOwnerUserIdHandler,
  UpdateUnitHandler,
  DeleteUnitHandler,
  DeleteOwnerHandler,
];

const QueryHandlers = [
  ListOwnersHandler,
  ListUnitsHandler,
  GetUnitDetailHandler,
  GetOwnerByIdHandler,
  GetPropertyOverviewHandler,
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
  DrizzleUnitOfWork,
];

@Module({
  imports: [
    CqrsModule,
    IdentityModule,
    TenancyModule,
    AuthModule,
    forwardRef(() => InvitationModule),
  ],
  controllers: [OwnerController, PropertyController, UnitController],
  providers: [...CommandHandlers, ...QueryHandlers, ...Repositories],
  exports: [],
})
export class PropertyModule {}
