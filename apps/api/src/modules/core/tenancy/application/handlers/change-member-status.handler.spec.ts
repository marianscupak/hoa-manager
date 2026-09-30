import { ChangeMemberStatusCommand } from '@/modules/core/tenancy/application/commands/change-member-status.command';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';
import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

import { ChangeMemberStatusHandler } from './change-member-status.handler';

const TENANT = 't1';
const ACTOR = 'm-admin';

const membership = (
  id: string,
  role: TenantMembershipRole,
  status: TenantMembershipStatus = TenantMembershipStatus.ACTIVE,
  tenantId = TENANT,
) => ({ id, tenantId, userId: `u-${id}`, role, status });

function buildHandler(
  target: ReturnType<typeof membership> | null,
  members: ReturnType<typeof membership>[] = [],
) {
  const membershipRepository = {
    findById: jest.fn().mockResolvedValue(target),
    listByTenant: jest.fn().mockResolvedValue(members),
    updateStatus: jest.fn().mockResolvedValue(undefined),
  };
  const uow = { execute: jest.fn((fn: () => Promise<unknown>) => fn()) };
  const auditService = { append: jest.fn().mockResolvedValue(undefined) };
  const auditContext = {
    requireActor: jest.fn().mockReturnValue({ type: 'USER', userId: 'u-x' }),
  };
  const labelResolver = {
    resolveUserLabel: jest.fn().mockResolvedValue('Jan Novák'),
    resolveActorLabel: jest.fn().mockResolvedValue('Karel Malý'),
  };
  const handler = new ChangeMemberStatusHandler(
    membershipRepository as never,
    uow as never,
    { now: () => new Date('2026-09-30T10:00:00Z') },
    auditService as never,
    auditContext as never,
    labelResolver as never,
  );
  return { handler, membershipRepository, auditService };
}

const command = (membershipId: string, status: TenantMembershipStatus) =>
  new ChangeMemberStatusCommand(
    TENANT,
    membershipId,
    ACTOR,
    status as TenantMembershipStatus.ACTIVE | TenantMembershipStatus.SUSPENDED,
  );

const errorCode = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return (error as DomainException).code;
  }
  return undefined;
};

describe('ChangeMemberStatusHandler', () => {
  it('suspends a member and records the change in the audit trail', async () => {
    const { handler, membershipRepository, auditService } = buildHandler(
      membership('m1', TenantMembershipRole.UNIT_OWNER),
    );

    await handler.execute(command('m1', TenantMembershipStatus.SUSPENDED));

    expect(membershipRepository.updateStatus).toHaveBeenCalledWith(
      TENANT,
      'm1',
      TenantMembershipStatus.SUSPENDED,
    );
    expect(auditService.append).toHaveBeenCalledTimes(1);
    expect(auditService.append.mock.calls[0][0].payload).toMatchObject({
      previousStatus: TenantMembershipStatus.ACTIVE,
      newStatus: TenantMembershipStatus.SUSPENDED,
    });
  });

  it('restores a suspended member', async () => {
    const { handler, membershipRepository } = buildHandler(
      membership(
        'm1',
        TenantMembershipRole.UNIT_OWNER,
        TenantMembershipStatus.SUSPENDED,
      ),
    );

    await handler.execute(command('m1', TenantMembershipStatus.ACTIVE));

    expect(membershipRepository.updateStatus).toHaveBeenCalledWith(
      TENANT,
      'm1',
      TenantMembershipStatus.ACTIVE,
    );
  });

  it('refuses a membership of another association', async () => {
    const { handler, membershipRepository } = buildHandler(
      membership(
        'm1',
        TenantMembershipRole.UNIT_OWNER,
        TenantMembershipStatus.ACTIVE,
        'other-tenant',
      ),
    );

    expect(
      await errorCode(
        handler.execute(command('m1', TenantMembershipStatus.SUSPENDED)),
      ),
    ).toBe(ErrorCode.MEMBERSHIP_NOT_FOUND);
    expect(membershipRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('refuses an unknown membership', async () => {
    const { handler } = buildHandler(null);

    expect(
      await errorCode(
        handler.execute(command('m1', TenantMembershipStatus.SUSPENDED)),
      ),
    ).toBe(ErrorCode.MEMBERSHIP_NOT_FOUND);
  });

  it('does not let an admin suspend themselves', async () => {
    const { handler, membershipRepository } = buildHandler(
      membership(ACTOR, TenantMembershipRole.ADMIN),
    );

    expect(
      await errorCode(
        handler.execute(command(ACTOR, TenantMembershipStatus.SUSPENDED)),
      ),
    ).toBe(ErrorCode.CANNOT_CHANGE_OWN_MEMBERSHIP_STATUS);
    expect(membershipRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('does not suspend the last active admin, however many suspended ones exist', async () => {
    const target = membership('m2', TenantMembershipRole.ADMIN);
    const { handler, membershipRepository } = buildHandler(target, [
      target,
      membership(
        'm3',
        TenantMembershipRole.ADMIN,
        TenantMembershipStatus.SUSPENDED,
      ),
      membership('m4', TenantMembershipRole.BOARD_MEMBER),
    ]);

    expect(
      await errorCode(
        handler.execute(command('m2', TenantMembershipStatus.SUSPENDED)),
      ),
    ).toBe(ErrorCode.LAST_ADMIN_CANNOT_BE_REMOVED);
    expect(membershipRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('suspends an admin while another active admin remains', async () => {
    const target = membership('m2', TenantMembershipRole.ADMIN);
    const { handler, membershipRepository } = buildHandler(target, [
      target,
      membership(ACTOR, TenantMembershipRole.ADMIN),
    ]);

    await handler.execute(command('m2', TenantMembershipStatus.SUSPENDED));

    expect(membershipRepository.updateStatus).toHaveBeenCalled();
  });

  it('does nothing when the status is already the requested one', async () => {
    const { handler, membershipRepository, auditService } = buildHandler(
      membership('m1', TenantMembershipRole.UNIT_OWNER),
    );

    await handler.execute(command('m1', TenantMembershipStatus.ACTIVE));

    expect(membershipRepository.updateStatus).not.toHaveBeenCalled();
    expect(auditService.append).not.toHaveBeenCalled();
  });
});
