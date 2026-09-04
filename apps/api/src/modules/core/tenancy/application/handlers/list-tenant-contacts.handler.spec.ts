import { ListTenantContactsQuery } from '@/modules/core/tenancy/application/queries/list-tenant-contacts.query';

import { ListTenantContactsHandler } from './list-tenant-contacts.handler';

const TENANT = 't1';

const membership = (
  id: string,
  role: string,
  status: string,
  fullName: string,
  email: string,
) => ({
  id,
  tenantId: TENANT,
  userId: `u-${id}`,
  role,
  status,
  user: { id: `u-${id}`, email, fullName },
});

function buildHandler(memberships: unknown[]) {
  const membershipRepo = {
    listByTenant: jest.fn().mockResolvedValue(memberships),
  };
  return {
    handler: new ListTenantContactsHandler(membershipRepo as never),
    membershipRepo,
  };
}

describe('ListTenantContactsHandler', () => {
  it('returns name and email of active admins only', async () => {
    const { handler, membershipRepo } = buildHandler([
      membership('m1', 'ADMIN', 'ACTIVE', 'Karel Malý', 'karel@example.com'),
      membership('m2', 'BOARD_MEMBER', 'ACTIVE', 'Board', 'board@example.com'),
      membership('m3', 'UNIT_OWNER', 'ACTIVE', 'Owner', 'owner@example.com'),
      membership('m4', 'ADMIN', 'SUSPENDED', 'Gone', 'gone@example.com'),
      membership('m5', 'ADMIN', 'INVITED', 'Pending', 'pending@example.com'),
    ]);

    const contacts = await handler.execute(new ListTenantContactsQuery(TENANT));

    expect(membershipRepo.listByTenant).toHaveBeenCalledWith(TENANT);
    expect(contacts).toEqual([
      { fullName: 'Karel Malý', email: 'karel@example.com' },
    ]);
  });

  it('returns an empty list when nobody qualifies', async () => {
    const { handler } = buildHandler([
      membership('m2', 'BOARD_MEMBER', 'ACTIVE', 'Board', 'board@example.com'),
    ]);

    await expect(
      handler.execute(new ListTenantContactsQuery(TENANT)),
    ).resolves.toEqual([]);
  });
});
