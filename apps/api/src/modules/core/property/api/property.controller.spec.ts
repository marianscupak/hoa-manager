import 'reflect-metadata';

import { ROLES_KEY } from '@/shared/api/guards/roles.guard';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';
import type { TenantContext } from '@/shared/domain/tenant-context';

import { PropertyController } from './property.controller';
import { GetPropertyOverviewQuery } from '../application/queries/get-property-overview/get-property-overview.query';

function ctx(roles: TenantMembershipRole[]): TenantContext {
  return {
    tenantId: 't-1',
    membershipId: 'm-1',
    roles,
    membershipStatus: TenantMembershipStatus.ACTIVE,
  };
}

describe('PropertyController', () => {
  let controller: PropertyController;
  let queryBus: { execute: jest.Mock };

  beforeEach(() => {
    queryBus = { execute: jest.fn().mockResolvedValue({}) };
    // Direct instantiation: @UseGuards/@Roles only run under the HTTP
    // pipeline. We test the dispatch behaviour here and assert the
    // role-gate metadata separately below.
    controller = new PropertyController(queryBus as unknown as never);
  });

  it('dispatches GetPropertyOverviewQuery with the viewer tenantId for ADMIN viewers', async () => {
    await controller.getOverview(ctx([TenantMembershipRole.ADMIN]));
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const arg = queryBus.execute.mock.calls[0][0];
    expect(arg).toBeInstanceOf(GetPropertyOverviewQuery);
    expect(arg).toMatchObject({ tenantId: 't-1' });
  });

  it('dispatches the query for BOARD_MEMBER viewers', async () => {
    await controller.getOverview(ctx([TenantMembershipRole.BOARD_MEMBER]));
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
  });

  it('dispatches the query for AUDITOR viewers', async () => {
    await controller.getOverview(ctx([TenantMembershipRole.AUDITOR]));
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
  });

  it('gates the route to ADMIN | BOARD_MEMBER | AUDITOR via @Roles metadata', () => {
    // The RolesGuard reads ROLES_KEY metadata and rejects requests
    // whose tenant context lacks any of the listed roles. Asserting on
    // the metadata directly is the unit-test substitute for spinning
    // up a Nest HTTP harness just to verify a UNIT_OWNER 403.
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      PropertyController.prototype.getOverview,
    );
    expect(roles).toEqual([
      TenantMembershipRole.ADMIN,
      TenantMembershipRole.BOARD_MEMBER,
      TenantMembershipRole.AUDITOR,
    ]);
    // UNIT_OWNER must NOT be on this list — that's the whole point of
    // the gate per spec §7.2.
    expect(roles).not.toContain(TenantMembershipRole.UNIT_OWNER);
  });
});
