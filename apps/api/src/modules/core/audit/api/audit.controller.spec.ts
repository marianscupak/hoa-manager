import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';
import type { AuthPrincipal } from '@/shared/domain/auth-principal';
import type { TenantContext } from '@/shared/domain/tenant-context';

import { AuditController } from './audit.controller';
import { GetTenantActivityQuery } from '../application/queries/get-tenant-activity/get-tenant-activity.query';

describe('AuditController', () => {
  let controller: AuditController;
  let queryBus: { execute: jest.Mock };

  const tenantCtx: TenantContext = {
    tenantId: 't-1',
    membershipId: 'm-1',
    roles: [TenantMembershipRole.UNIT_OWNER],
    membershipStatus: TenantMembershipStatus.ACTIVE,
  };

  const user: AuthPrincipal = {
    userId: 'u-1',
    subject: 'u-1',
    authMethod: 'JWT',
    preferredLanguage: 'en',
  };

  beforeEach(() => {
    queryBus = { execute: jest.fn().mockResolvedValue({ entries: [] }) };
    // Direct instantiation: the @UseGuards decorators only run in an HTTP
    // pipeline, not when we invoke the handler method directly here.
    controller = new AuditController(queryBus as unknown as never);
  });

  it('dispatches a GetTenantActivityQuery with the default limit', async () => {
    await controller.getActivity(tenantCtx, user, 10, 'en');
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const arg = queryBus.execute.mock.calls[0][0];
    expect(arg).toBeInstanceOf(GetTenantActivityQuery);
    expect(arg).toMatchObject({
      tenantId: 't-1',
      viewerUserId: 'u-1',
      viewerRoles: [TenantMembershipRole.UNIT_OWNER],
      viewerLanguage: 'en',
      limit: 10,
    });
  });

  it('clamps limit to the [1, 50] range', async () => {
    await controller.getActivity(tenantCtx, user, 999, 'en');
    expect(queryBus.execute.mock.calls[0][0].limit).toBe(50);

    await controller.getActivity(tenantCtx, user, 0, 'en');
    expect(queryBus.execute.mock.calls[1][0].limit).toBe(1);
  });

  it('falls back to user.preferredLanguage when no Accept-Language header is present', async () => {
    await controller.getActivity(tenantCtx, user, 10, undefined);
    expect(queryBus.execute.mock.calls[0][0].viewerLanguage).toBe('en');
  });
});
