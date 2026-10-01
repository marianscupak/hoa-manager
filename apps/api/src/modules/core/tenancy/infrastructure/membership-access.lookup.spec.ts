import type { QueryBus } from '@nestjs/cqrs';

import { GetMembershipByTenantAndUserQuery } from '@/modules/core/tenancy/application/queries/get-membership-by-tenant-and-user.query';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

import { QueryBusMembershipAccessLookup } from './membership-access.lookup';

function lookupAnswering(result: unknown) {
  const execute = jest.fn(() => Promise.resolve(result));
  const lookup = new QueryBusMembershipAccessLookup({
    execute,
  } as unknown as QueryBus);
  return { lookup, execute };
}

describe('QueryBusMembershipAccessLookup', () => {
  it('returns the membership the guard needs', async () => {
    const { lookup, execute } = lookupAnswering({
      id: 'membership-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      role: TenantMembershipRole.AUDITOR,
      status: TenantMembershipStatus.SUSPENDED,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeenAt: null,
    });

    await expect(lookup.findMembership('tenant-1', 'user-1')).resolves.toEqual({
      id: 'membership-1',
      tenantId: 'tenant-1',
      role: TenantMembershipRole.AUDITOR,
      status: TenantMembershipStatus.SUSPENDED,
    });
    expect(execute).toHaveBeenCalledWith(
      new GetMembershipByTenantAndUserQuery('tenant-1', 'user-1'),
    );
  });

  it('returns null when the user is not a member', async () => {
    const { lookup } = lookupAnswering(null);

    await expect(
      lookup.findMembership('tenant-1', 'user-1'),
    ).resolves.toBeNull();
  });
});
