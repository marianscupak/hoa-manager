import type { InviteReadRepository } from '@/modules/core/invitation/application/ports/invite-read.repository.port';
import type { OwnerReadRepository } from '@/modules/core/property/application/ports/owner-read.repository.port';
import type { UnitReadRepository } from '@/modules/core/property/application/ports/unit-read.repository.port';
import { type Clock } from '@/shared/application/ports/clock.port';

import { GetPropertyOverviewHandler } from './get-property-overview.handler';
import { GetPropertyOverviewQuery } from './get-property-overview.query';

describe('GetPropertyOverviewHandler', () => {
  let handler: GetPropertyOverviewHandler;
  let units: jest.Mocked<UnitReadRepository>;
  let owners: jest.Mocked<OwnerReadRepository>;
  let invites: jest.Mocked<InviteReadRepository>;
  let clock: Clock;

  const fixedNow = new Date('2026-05-14T12:00:00Z');

  beforeEach(() => {
    units = { getOverview: jest.fn(), findOwnedByMembership: jest.fn() };
    owners = { countActive: jest.fn() };
    invites = { getPendingSummary: jest.fn() };
    clock = { now: () => fixedNow };
    handler = new GetPropertyOverviewHandler(units, owners, invites, clock);
  });

  it('returns aggregated counts and sums', async () => {
    units.getOverview.mockResolvedValue({
      total: 12,
      withoutOwnersCount: 2,
      buildingShareSum: 99.87,
    });
    owners.countActive.mockResolvedValue(10);
    invites.getPendingSummary.mockResolvedValue({
      pending: 3,
      oldestPendingCreatedAt: new Date('2026-05-01T00:00:00Z'),
    });

    const result = await handler.execute(new GetPropertyOverviewQuery('t-1'));

    expect(result).toEqual({
      units: { total: 12, withoutOwnersCount: 2, buildingShareSum: 99.87 },
      owners: { active: 10 },
      invites: {
        pending: 3,
        oldestPendingCreatedAt: '2026-05-01T00:00:00.000Z',
      },
    });
    expect(units.getOverview).toHaveBeenCalledWith('t-1', fixedNow);
  });

  it('reports buildingShareSum exactly as 100 when shares add up perfectly', async () => {
    units.getOverview.mockResolvedValue({
      total: 5,
      withoutOwnersCount: 0,
      buildingShareSum: 100,
    });
    owners.countActive.mockResolvedValue(5);
    invites.getPendingSummary.mockResolvedValue({
      pending: 0,
      oldestPendingCreatedAt: null,
    });

    const result = await handler.execute(new GetPropertyOverviewQuery('t-1'));

    expect(result.units.buildingShareSum).toBe(100);
    expect(result.invites.oldestPendingCreatedAt).toBeNull();
  });

  it('oldestPendingCreatedAt is null when there are no pending invites', async () => {
    units.getOverview.mockResolvedValue({
      total: 0,
      withoutOwnersCount: 0,
      buildingShareSum: 0,
    });
    owners.countActive.mockResolvedValue(0);
    invites.getPendingSummary.mockResolvedValue({
      pending: 0,
      oldestPendingCreatedAt: null,
    });

    const result = await handler.execute(new GetPropertyOverviewQuery('t-1'));

    expect(result.invites.pending).toBe(0);
    expect(result.invites.oldestPendingCreatedAt).toBeNull();
  });

  it('passes the tenantId and clock.now() to every repo', async () => {
    units.getOverview.mockResolvedValue({
      total: 0,
      withoutOwnersCount: 0,
      buildingShareSum: 0,
    });
    owners.countActive.mockResolvedValue(0);
    invites.getPendingSummary.mockResolvedValue({
      pending: 0,
      oldestPendingCreatedAt: null,
    });

    await handler.execute(new GetPropertyOverviewQuery('t-42'));

    expect(units.getOverview).toHaveBeenCalledWith('t-42', fixedNow);
    expect(owners.countActive).toHaveBeenCalledWith('t-42', fixedNow);
    expect(invites.getPendingSummary).toHaveBeenCalledWith('t-42', fixedNow);
  });
});
