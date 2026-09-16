import { type ElectorateDataRepository } from '@/modules/voting/application/ports/electorate-data.repository.port';
import { VoteMode } from '@/modules/voting/domain/vote/vote.types';

import { AssemblyMeetingDateGuard } from './assembly-meeting-date.guard';

const REGISTER_START = new Date('2026-09-15T07:51:18.163Z');

function build(registerStart: Date | null = REGISTER_START) {
  return new AssemblyMeetingDateGuard({
    findOwnershipRegisterStart: jest.fn(async () => registerStart),
  } as unknown as ElectorateDataRepository);
}

const assertFor = (guard: AssemblyMeetingDateGuard, meetingDate: Date | null) =>
  guard.assertWithinOwnershipRegister(
    'tenant-1',
    VoteMode.ASSEMBLY_RECORD,
    meetingDate,
  );

describe('AssemblyMeetingDateGuard', () => {
  it('refuses a meeting held before the ownership register begins', async () => {
    // Nobody owned anything on that day as far as the register is concerned,
    // so no unit could be marked present and the association's own unit would
    // be counted toward a quorum it has no vote in. Neither is repairable
    // afterwards — the register cannot be backdated — so the date is refused
    // while changing it is still free.
    await expect(
      assertFor(build(), new Date('2026-09-11T12:00:00Z')),
    ).rejects.toMatchObject({
      code: 'ASSEMBLY_MEETING_BEFORE_OWNERSHIP_RECORDS',
    });
  });

  it('allows a meeting held once the register covers it', async () => {
    await expect(
      assertFor(build(), new Date('2026-09-16T09:00:00Z')),
    ).resolves.toBeUndefined();
  });

  it('allows a meeting held at the very instant the register opens', async () => {
    await expect(assertFor(build(), REGISTER_START)).resolves.toBeUndefined();
  });

  it('has nothing to check in a building with no ownership on record', async () => {
    // An empty register is a different problem and refusing the date would
    // not help with it.
    await expect(
      assertFor(build(null), new Date('2026-09-11T12:00:00Z')),
    ).resolves.toBeUndefined();
  });

  it('leaves a per-rollam vote alone', async () => {
    // Its electorate is resolved when the vote opens, not at a past date.
    const guard = build();

    await expect(
      guard.assertWithinOwnershipRegister(
        'tenant-1',
        VoteMode.PER_ROLLAM,
        new Date('2026-09-11T12:00:00Z'),
      ),
    ).resolves.toBeUndefined();
  });

  it('leaves a record with no meeting date yet alone', async () => {
    // The wizard creates the vote first and sets the date a step later.
    await expect(assertFor(build(), null)).resolves.toBeUndefined();
  });
});
