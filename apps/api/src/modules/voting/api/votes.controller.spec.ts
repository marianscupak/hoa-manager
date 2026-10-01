import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants';

import { ROLES_KEY, RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantMembershipRole } from '@/shared/domain/membership';

import { VotesController } from './votes.controller';

// `@Roles` is declared as `(...roles: string[])`, so the metadata comes back
// as plain strings; the enum members are string-valued, so they compare
// directly.
const rolesOf = (method: keyof VotesController) =>
  Reflect.getMetadata(ROLES_KEY, VotesController.prototype[method]) as
    | string[]
    | undefined;

describe('VotesController role metadata', () => {
  const BOARD = [TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER];
  const BOARD_AND_AUDITOR = [...BOARD, TenantMembershipRole.AUDITOR];

  it('gates the running tally to the board view roles', () => {
    expect(rolesOf('getVoteTally')).toEqual(BOARD_AND_AUDITOR);
  });

  it('actually runs RolesGuard on the gated tally route', () => {
    // `@Roles` alone is inert decoration: `RolesGuard` is not registered
    // globally (see app.module.ts), and it returns `true` when no metadata
    // is present. Without this assertion, deleting `RolesGuard` from
    // `getVoteTally`'s `@UseGuards` would open the board-only tally to every
    // tenant member with the rest of this file still green.
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        VotesController.prototype.getVoteTally,
      ),
    ).toContain(RolesGuard);
  });

  it.each([
    'getVoteTurnout',
    'getVoteParticipation',
    'getVoteResults',
  ] as const)('leaves %s readable by every tenant member', (method) => {
    // These three disclose no individual ballot, or redact per role inside
    // their handler. Adding @Roles here would break the owner view; the
    // absence is deliberate, so it is asserted.
    expect(rolesOf(method)).toBeUndefined();
  });

  it.each(['recordPaperBallot', 'closeVote', 'createVote'] as const)(
    'keeps %s restricted to admins and board members',
    (method) => {
      expect(rolesOf(method)).toEqual(BOARD);
    },
  );

  it('keeps the audit export open to auditors as well', () => {
    expect(rolesOf('getAuditExport')).toEqual(BOARD_AND_AUDITOR);
  });
});
