import {
  VoteStatus,
  VoteUnitConsentStatus,
} from '@/modules/voting/domain/vote/vote.types';
import { ConsentAlreadyRecordedException } from '@/shared/application/exceptions/vote.exceptions';

import { CreateVoteConsentCommand } from './create-vote-consent.command';
import { CreateVoteConsentHandler } from './create-vote-consent.handler';

const TENANT = 't1';
const VOTE = 'v1';
const UNIT = 'u1';
const RECORDER_MEMBERSHIP = 'admin-m1';
const DELEGATE_MEMBERSHIP = 'delegate-m1';

function buildHandler(overrides?: {
  isActiveUnitOwner?: boolean;
  owningUnits?: { id: string }[];
  ownerIdByMembership?: string | null;
  saveImpl?: () => Promise<string>;
}) {
  const voteWriteRepo = {
    findById: jest.fn().mockResolvedValue({
      id: VOTE,
      tenantId: TENANT,
      status: VoteStatus.SCHEDULED,
      title: 'Vote 1',
    }),
  };
  const consentWriteRepo = {
    save: jest.fn(overrides?.saveImpl ?? (() => Promise.resolve('consent-1'))),
  };
  const voteReadRepo = {
    findVoterStatus: jest.fn().mockResolvedValue({
      owningUnits: overrides?.owningUnits ?? [{ id: UNIT }],
    }),
    getOwnerIdByMembership: jest
      .fn()
      .mockResolvedValue(
        overrides?.ownerIdByMembership === undefined
          ? 'owner-self-1'
          : overrides.ownerIdByMembership,
      ),
    isActiveUnitOwner: jest
      .fn()
      .mockResolvedValue(overrides?.isActiveUnitOwner ?? true),
  };
  const unitOfWork = { execute: jest.fn((fn: () => Promise<void>) => fn()) };
  const clock = { now: () => new Date('2026-08-31T10:00:00Z') };
  const auditService = { append: jest.fn() };
  const auditContext = {
    requireActor: jest
      .fn()
      .mockReturnValue({ type: 'USER', userId: RECORDER_MEMBERSHIP }),
  };
  const labelResolver = {
    resolveActorLabel: jest.fn().mockResolvedValue('Admin Actor'),
    resolveUnitLabel: jest.fn().mockResolvedValue('Unit 1'),
    resolveOwnerLabel: jest.fn().mockResolvedValue('Owner Label'),
    resolveMembershipLabel: jest.fn().mockResolvedValue('Delegate Label'),
  };

  const handler = new CreateVoteConsentHandler(
    voteWriteRepo as never,
    consentWriteRepo as never,
    voteReadRepo as never,
    unitOfWork as never,
    clock as never,
    auditService as never,
    auditContext as never,
    labelResolver as never,
  );

  return {
    handler,
    voteWriteRepo,
    consentWriteRepo,
    voteReadRepo,
    auditService,
    labelResolver,
  };
}

describe('CreateVoteConsentHandler', () => {
  it('records a consent from an account-less owner when an admin sends fromOwnerId', async () => {
    const { handler, consentWriteRepo, voteReadRepo, labelResolver } =
      buildHandler({ isActiveUnitOwner: true });

    await handler.execute(
      new CreateVoteConsentCommand(
        TENANT,
        VOTE,
        UNIT,
        RECORDER_MEMBERSHIP,
        DELEGATE_MEMBERSHIP,
        ['ADMIN'],
        'owner-accountless-1',
      ),
    );

    expect(voteReadRepo.isActiveUnitOwner).toHaveBeenCalledWith(
      TENANT,
      UNIT,
      'owner-accountless-1',
      expect.any(Date),
    );
    // No membership lookup for the grantor on the admin path.
    expect(voteReadRepo.findVoterStatus).not.toHaveBeenCalled();
    expect(voteReadRepo.getOwnerIdByMembership).not.toHaveBeenCalled();

    expect(consentWriteRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT,
        voteId: VOTE,
        unitId: UNIT,
        fromOwnerId: 'owner-accountless-1',
        toMembershipId: DELEGATE_MEMBERSHIP,
        recordedByMembershipId: RECORDER_MEMBERSHIP,
        status: VoteUnitConsentStatus.VALID,
      }),
    );
    expect(labelResolver.resolveOwnerLabel).toHaveBeenCalledWith(
      'owner-accountless-1',
    );
  });

  it('rejects fromOwnerId that is not an active owner of the unit', async () => {
    const { handler } = buildHandler({ isActiveUnitOwner: false });

    await expect(
      handler.execute(
        new CreateVoteConsentCommand(
          TENANT,
          VOTE,
          UNIT,
          RECORDER_MEMBERSHIP,
          DELEGATE_MEMBERSHIP,
          ['BOARD_MEMBER'],
          'owner-not-active-1',
        ),
      ),
    ).rejects.toMatchObject({ code: 'NOT_A_UNIT_OWNER' });
  });

  it('rejects fromOwnerId sent by a non-admin/board caller', async () => {
    const { handler } = buildHandler();

    await expect(
      handler.execute(
        new CreateVoteConsentCommand(
          TENANT,
          VOTE,
          UNIT,
          RECORDER_MEMBERSHIP,
          DELEGATE_MEMBERSHIP,
          ['UNIT_OWNER'],
          'owner-accountless-1',
        ),
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('keeps the self-service path unchanged when fromOwnerId is omitted', async () => {
    const { handler, consentWriteRepo, voteReadRepo } = buildHandler({
      ownerIdByMembership: 'owner-self-1',
      owningUnits: [{ id: UNIT }],
    });

    await handler.execute(
      new CreateVoteConsentCommand(
        TENANT,
        VOTE,
        UNIT,
        RECORDER_MEMBERSHIP,
        DELEGATE_MEMBERSHIP,
        ['UNIT_OWNER'],
      ),
    );

    expect(voteReadRepo.isActiveUnitOwner).not.toHaveBeenCalled();
    expect(voteReadRepo.findVoterStatus).toHaveBeenCalledWith(
      TENANT,
      VOTE,
      RECORDER_MEMBERSHIP,
      expect.any(Date),
    );
    expect(voteReadRepo.getOwnerIdByMembership).toHaveBeenCalledWith(
      TENANT,
      RECORDER_MEMBERSHIP,
    );
    expect(consentWriteRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        fromOwnerId: 'owner-self-1',
        recordedByMembershipId: RECORDER_MEMBERSHIP,
      }),
    );
  });

  it('propagates CONSENT_ALREADY_RECORDED when the write repository rejects a duplicate', async () => {
    const { handler } = buildHandler({
      isActiveUnitOwner: true,
      saveImpl: () => Promise.reject(new ConsentAlreadyRecordedException()),
    });

    await expect(
      handler.execute(
        new CreateVoteConsentCommand(
          TENANT,
          VOTE,
          UNIT,
          RECORDER_MEMBERSHIP,
          DELEGATE_MEMBERSHIP,
          ['ADMIN'],
          'owner-accountless-1',
        ),
      ),
    ).rejects.toMatchObject({ code: 'CONSENT_ALREADY_RECORDED' });
  });
});
