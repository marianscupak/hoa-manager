import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuthModule } from '@/modules/auth/auth.module';
import { IdentityModule } from '@/modules/identity/identity.module';
import { InvitationModule } from '@/modules/invitation/invitation.module';
import { OwnerController } from '@/modules/property/api/owner.controller';
import { UnitController } from '@/modules/property/api/unit.controller';
import { CreateOwnerHandler } from '@/modules/property/application/handlers/create-owner.handler';
import { CreateUnitHandler } from '@/modules/property/application/handlers/create-unit.handler';
import { GetUnitDetailHandler } from '@/modules/property/application/handlers/get-unit-detail.handler';
import { ListOwnersHandler } from '@/modules/property/application/handlers/list-owners.handler';
import { ListUnitsHandler } from '@/modules/property/application/handlers/list-units.handler';
import { ReplaceUnitOwnershipHandler } from '@/modules/property/application/handlers/replace-unit-ownership.handler';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
} from '@/modules/property/application/ports/property.repository.port';
import {
  DrizzleOwnerRepository,
  DrizzleUnitOwnershipRepository,
  DrizzleUnitRepository,
} from '@/modules/property/infrastructure/persistence/drizzle-property.repository';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';

const CommandHandlers = [
  CreateOwnerHandler,
  CreateUnitHandler,
  ReplaceUnitOwnershipHandler,
];

const QueryHandlers = [
  ListOwnersHandler,
  ListUnitsHandler,
  GetUnitDetailHandler,
];

const Repositories = [
  { provide: UNIT_REPOSITORY, useClass: DrizzleUnitRepository },
  { provide: OWNER_REPOSITORY, useClass: DrizzleOwnerRepository },
  {
    provide: UNIT_OWNERSHIP_REPOSITORY,
    useClass: DrizzleUnitOwnershipRepository,
  },
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
  controllers: [OwnerController, UnitController],
  providers: [...CommandHandlers, ...QueryHandlers, ...Repositories],
  exports: [OWNER_REPOSITORY],
})
export class PropertyModule {}
