import { GetUserTenantsQuery } from '@/modules/core/tenancy/application/queries/get-user-tenants.query';

import { GetUserTenantsHandler } from './get-user-tenants.handler';

describe('GetUserTenantsHandler', () => {
  it('lists only the associations the user can enter', async () => {
    const membershipRepository = {
      findTenantsWithMembership: jest.fn().mockResolvedValue([
        {
          tenantId: 't1',
          tenantName: 'SVJ A',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
        {
          tenantId: 't2',
          tenantName: 'SVJ B',
          role: 'UNIT_OWNER',
          status: 'SUSPENDED',
        },
      ]),
    };
    const handler = new GetUserTenantsHandler(membershipRepository as never);

    const tenants = await handler.execute(new GetUserTenantsQuery('u1'));

    expect(tenants).toEqual([
      { id: 't1', name: 'SVJ A', role: 'ADMIN', status: 'ACTIVE' },
    ]);
  });
});
