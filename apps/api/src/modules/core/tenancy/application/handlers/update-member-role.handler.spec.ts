import { UpdateMemberRoleCommand } from '@/modules/core/tenancy/application/commands/update-member-role.command';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';
import { ErrorCode } from '@/shared/errors/error-codes';

import { UpdateMemberRoleHandler } from './update-member-role.handler';

const TENANT = 't1';

const admin = (id: string, status = TenantMembershipStatus.ACTIVE) => ({
  id,
  tenantId: TENANT,
  userId: `u-${id}`,
  role: TenantMembershipRole.ADMIN,
  status,
});

function buildHandler(target: ReturnType<typeof admin>, members: unknown[]) {
  const membershipRepository = {
    findById: jest.fn().mockResolvedValue(target),
    listByTenant: jest.fn().mockResolvedValue(members),
    updateRole: jest.fn().mockResolvedValue(undefined),
  };
  const handler = new UpdateMemberRoleHandler(
    membershipRepository as never,
    { execute: jest.fn((fn: () => Promise<unknown>) => fn()) } as never,
    { now: () => new Date('2026-09-30T10:00:00Z') },
    { append: jest.fn() } as never,
    { requireActor: jest.fn().mockReturnValue({ type: 'USER' }) } as never,
    {
      resolveUserLabel: jest.fn().mockResolvedValue('A'),
      resolveActorLabel: jest.fn().mockResolvedValue('B'),
    } as never,
  );
  return { handler, membershipRepository };
}

describe('UpdateMemberRoleHandler', () => {
  it('does not demote the last active admin when the other admin is suspended', async () => {
    const target = admin('m1');
    const { handler, membershipRepository } = buildHandler(target, [
      target,
      admin('m2', TenantMembershipStatus.SUSPENDED),
    ]);

    await expect(
      handler.execute(
        new UpdateMemberRoleCommand(
          TENANT,
          'm1',
          TenantMembershipRole.BOARD_MEMBER,
        ),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.LAST_ADMIN_CANNOT_BE_REMOVED });
    expect(membershipRepository.updateRole).not.toHaveBeenCalled();
  });

  it('demotes an admin while another active admin remains', async () => {
    const target = admin('m1');
    const { handler, membershipRepository } = buildHandler(target, [
      target,
      admin('m2'),
    ]);

    await handler.execute(
      new UpdateMemberRoleCommand(
        TENANT,
        'm1',
        TenantMembershipRole.BOARD_MEMBER,
      ),
    );

    expect(membershipRepository.updateRole).toHaveBeenCalledWith(
      TENANT,
      'm1',
      TenantMembershipRole.BOARD_MEMBER,
    );
  });
});
