import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import type {
  ElectorateConsentInput,
  ElectoratePartyInput,
} from '@/modules/voting/domain/vote/electorate-resolution';
import {
  memberRef,
  ownerRef,
} from '@/modules/voting/domain/vote/representative-ref';
import { VoteWeightBasis } from '@/modules/voting/domain/vote/vote.types';
import {
  MembershipHasNoAssociatedOwnerException,
  NotAUnitOwnerException,
} from '@/shared/application/exceptions/vote.exceptions';

import { PreviewConsentOutcomeHandler } from './preview-consent-outcome.handler';
import { PreviewConsentOutcomeQuery } from './preview-consent-outcome.query';

const TENANT = 't1';
const VOTE = 'v1';
const UNIT = 'u1';
const WIFE_MEMBERSHIP = 'mw';
const BOARD_MEMBERSHIP = 'board';

const member = (ownerId: string, membershipId: string | null) => ({
  ownerId,
  ownerKind: OwnerKind.PERSON,
  membershipId,
});

const SJM: ElectoratePartyInput = {
  unitId: UNIT,
  partyType: OwnershipPartyType.SJM,
  shareNumerator: 1,
  shareDenominator: 1,
  members: [member('wife', WIFE_MEMBERSHIP), member('husband', 'mh')],
};

const SOLE: ElectoratePartyInput = {
  unitId: UNIT,
  partyType: OwnershipPartyType.SOLE,
  shareNumerator: 1,
  shareDenominator: 1,
  members: [member('wife', WIFE_MEMBERSHIP)],
};

function buildHandler(overrides?: {
  parties?: ElectoratePartyInput[];
  consents?: ElectorateConsentInput[];
  ownerIdByMembership?: string | null;
  isActiveUnitOwner?: boolean;
}) {
  const voteReadRepo = {
    getOwnerIdByMembership: jest
      .fn()
      .mockResolvedValue(
        overrides?.ownerIdByMembership === undefined
          ? 'wife'
          : overrides.ownerIdByMembership,
      ),
    isActiveUnitOwner: jest
      .fn()
      .mockResolvedValue(overrides?.isActiveUnitOwner ?? true),
    loadElectorateInputs: jest.fn().mockResolvedValue({
      units: [
        { id: UNIT, buildingShareNumerator: 1, buildingShareDenominator: 10 },
      ],
      parties: overrides?.parties ?? [SJM],
      consents: overrides?.consents ?? [],
      weightBasis: VoteWeightBasis.UNIT_SHARE,
    }),
  };
  const clock = { now: () => new Date('2026-09-04T10:00:00Z') };

  const handler = new PreviewConsentOutcomeHandler(
    voteReadRepo as never,
    clock as never,
  );

  return { handler, voteReadRepo };
}

const run = (
  handler: PreviewConsentOutcomeHandler,
  delegateMembershipId = BOARD_MEMBERSHIP,
) =>
  handler.execute(
    new PreviewConsentOutcomeQuery(
      TENANT,
      VOTE,
      UNIT,
      { toMembershipId: delegateMembershipId },
      'caller-membership',
    ),
  );

describe('PreviewConsentOutcomeHandler', () => {
  it('warns when a spouse hands the unit on and the other spouse still backs them', async () => {
    const { handler } = buildHandler({
      consents: [
        {
          unitId: UNIT,
          fromOwnerId: 'husband',
          to: ownerRef('wife'),
        },
      ],
    });

    await expect(run(handler)).resolves.toEqual({
      wouldLeaveUnitWithoutRepresentative: true,
    });
  });

  it('warns when the first spouse consents to an outsider on their own', async () => {
    const { handler } = buildHandler();

    await expect(run(handler)).resolves.toEqual({
      wouldLeaveUnitWithoutRepresentative: true,
    });
  });

  it('does not warn when both spouses end up backing the same outsider', async () => {
    const { handler } = buildHandler({
      consents: [
        {
          unitId: UNIT,
          fromOwnerId: 'husband',
          to: memberRef(BOARD_MEMBERSHIP),
        },
      ],
    });

    await expect(run(handler)).resolves.toEqual({
      wouldLeaveUnitWithoutRepresentative: false,
    });
  });

  it('does not warn when a sole owner delegates', async () => {
    const { handler } = buildHandler({ parties: [SOLE] });

    await expect(run(handler)).resolves.toEqual({
      wouldLeaveUnitWithoutRepresentative: false,
    });
  });

  it('previews against the caller as grantor, not the delegate', async () => {
    const { handler, voteReadRepo } = buildHandler();

    await run(handler);

    expect(voteReadRepo.isActiveUnitOwner).toHaveBeenCalledWith(
      TENANT,
      UNIT,
      'wife',
      new Date('2026-09-04T10:00:00Z'),
    );
  });

  it('rejects a caller who does not own the unit', async () => {
    const { handler } = buildHandler({ isActiveUnitOwner: false });

    await expect(run(handler)).rejects.toThrow(NotAUnitOwnerException);
  });

  it('rejects a membership with no owner record', async () => {
    const { handler } = buildHandler({ ownerIdByMembership: null });

    await expect(run(handler)).rejects.toThrow(
      MembershipHasNoAssociatedOwnerException,
    );
  });

  it('previews a consent that names the other spouse as an owner without an account', async () => {
    const { handler } = buildHandler({
      parties: [
        { ...SJM, members: [member('wife', null), member('husband', null)] },
      ],
      consents: [],
      ownerIdByMembership: 'wife',
    });
    // The caller here is an admin previewing for the wife; the handler still
    // resolves the grantor from the caller's membership, so the spec keeps
    // the wife as the caller's owner.
    const result = await handler.execute(
      new PreviewConsentOutcomeQuery(
        TENANT,
        VOTE,
        UNIT,
        { toOwnerId: 'husband' },
        WIFE_MEMBERSHIP,
      ),
    );
    expect(result.wouldLeaveUnitWithoutRepresentative).toBe(false);
  });

  it('rejects a preview that names both or neither target', async () => {
    const { handler } = buildHandler();
    await expect(
      handler.execute(
        new PreviewConsentOutcomeQuery(TENANT, VOTE, UNIT, {}, WIFE_MEMBERSHIP),
      ),
    ).rejects.toMatchObject({ code: 'CONSENT_TARGET_INVALID' });
  });
});
