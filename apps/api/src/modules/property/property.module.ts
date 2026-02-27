import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OwnerController } from './api/owner.controller';
import { UnitController } from './api/unit.controller';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CreateOwnerHandler } from './application/handlers/create-owner.handler';
import { CreateUnitHandler } from './application/handlers/create-unit.handler';
import { GetUnitDetailHandler } from './application/handlers/get-unit-detail.handler';
import { ListOwnersHandler } from './application/handlers/list-owners.handler';
import { ListUnitsHandler } from './application/handlers/list-units.handler';
import { ReplaceUnitOwnershipHandler } from './application/handlers/replace-unit-ownership.handler';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
} from './application/ports/property.repository.port';
import {
  DrizzleOwnerRepository,
  DrizzleUnitOwnershipRepository,
  DrizzleUnitRepository,
} from './infrastructure/persistence/drizzle-property.repository';
import { DrizzleUnitOfWork } from '../../infrastructure/db/drizzle.unit-of-work';

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
  imports: [CqrsModule, IdentityModule, TenancyModule, AuthModule],
  controllers: [OwnerController, UnitController],
  providers: [...CommandHandlers, ...QueryHandlers, ...Repositories],
})
export class PropertyModule {}
