import 'reflect-metadata';

import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';
import { ROLES_KEY } from '@/shared/api/guards/roles.guard';
import type { TenantContext } from '@/shared/domain/tenant-context';

import { UnitController } from './unit.controller';
import { GetOwnedUnitsQuery } from '../application/queries/get-owned-units/get-owned-units.query';

function ctx(
  roles: TenantMembershipRole[],
  overrides: Partial<TenantContext> = {},
): TenantContext {
  return {
    tenantId: 't-1',
    membershipId: 'm-1',
    roles,
    membershipStatus: TenantMembershipStatus.ACTIVE,
    ...overrides,
  };
}

describe('UnitController', () => {
  let controller: UnitController;
  let queryBus: { execute: jest.Mock };
  let commandBus: { execute: jest.Mock };

  beforeEach(() => {
    queryBus = { execute: jest.fn().mockResolvedValue([]) };
    commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    // Direct instantiation: @UseGuards/@Roles only run under the HTTP
    // pipeline. We test the dispatch behaviour here and assert the
    // role-gate metadata separately below.
    controller = new UnitController(
      queryBus as unknown as never,
      commandBus as unknown as never,
    );
  });

  describe('getMyOwnedUnits', () => {
    it('dispatches GetOwnedUnitsQuery with the caller tenantId and membershipId', async () => {
      await controller.getMyOwnedUnits(
        ctx([TenantMembershipRole.UNIT_OWNER], { membershipId: 'm-42' }),
      );

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const arg = queryBus.execute.mock.calls[0][0];
      expect(arg).toBeInstanceOf(GetOwnedUnitsQuery);
      expect(arg).toMatchObject({ tenantId: 't-1', membershipId: 'm-42' });
    });

    it('has no @Roles gate — any authenticated tenant member can call', () => {
      // The /units/mine route is intentionally open to every
      // authenticated member (per Phase 4 spec: "frontend only renders
      // for owner-view roles" — no server-side role gate). Reading the
      // metadata directly is the unit-test substitute for a full HTTP
      // harness.
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        UnitController.prototype.getMyOwnedUnits,
      );
      expect(roles).toBeUndefined();
    });
  });
});
