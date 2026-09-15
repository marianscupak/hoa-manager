import { GetOwnerByIdQuery } from '@/modules/core/property/application/queries/get-owner-by-id.query';

import { GetOwnerByIdHandler } from './get-owner-by-id.handler';

const TENANT = 't1';

const OWNER = {
  id: 'o1',
  tenantId: TENANT,
  displayName: 'ACME s.r.o.',
  email: 'acme@example.com',
  userId: null,
  kind: 'LEGAL_ENTITY',
  katastrPersonId: 'k-person-1',
  ico: '250830',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function buildHandler(overrides?: { owner?: unknown }) {
  const ownerRepo = {
    findById: jest
      .fn()
      .mockResolvedValue(
        overrides && 'owner' in overrides ? overrides.owner : OWNER,
      ),
  };
  const handler = new GetOwnerByIdHandler(ownerRepo as never);
  return { handler };
}

describe('GetOwnerByIdHandler', () => {
  it('exposes ico but never the cadastre person id', async () => {
    const { handler } = buildHandler();

    const owner = await handler.execute(new GetOwnerByIdQuery(TENANT, 'o1'));

    expect(owner?.ico).toBe('250830');
    // Identifies a person in a state register; the design refuses to
    // store owner addresses for the same reason.
    expect(owner).not.toHaveProperty('katastrPersonId');
  });

  it('returns null when the owner does not exist', async () => {
    const { handler } = buildHandler({ owner: null });

    const owner = await handler.execute(new GetOwnerByIdQuery(TENANT, 'o1'));

    expect(owner).toBeNull();
  });
});
