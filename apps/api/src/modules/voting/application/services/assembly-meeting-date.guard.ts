import { Inject, Injectable } from '@nestjs/common';

import { VoteMode } from '@/modules/voting/domain/vote/vote.types';
import { AssemblyMeetingBeforeOwnershipRecordsException } from '@/shared/application/exceptions/vote.exceptions';
import { formatAssociationDate } from '@/shared/domain/association-date';

import {
  ELECTORATE_DATA_REPOSITORY,
  type ElectorateDataRepository,
} from '../ports/electorate-data.repository.port';

/**
 * An assembly record reads the ownership register as it stood on the day of
 * the meeting — those are the owners the minutes name and the ones the roster
 * has to offer. That only works while the register reaches back that far.
 *
 * When it does not, the literal reading is that nobody owned anything: every
 * unit comes back `MISSING_OWNERSHIP`, which `isRecordableAtAssembly` refuses,
 * so not one ballot can be entered — and a unit the association owns loses the
 * `ASSOCIATION_OWNED` classification that keeps its non-existent vote (§ 1206
 * odst. 1) out of the quorum denominator, which is how a quorate assembly
 * came to publish as inquorate.
 *
 * There is no repair available afterwards: `planOwnershipTransition` refuses
 * an effective date before the latest period, so the register cannot be
 * backdated, and a record carrying a ballot can no longer be edited. So the
 * date is refused at the point it is set, where changing it still costs
 * nothing.
 */
@Injectable()
export class AssemblyMeetingDateGuard {
  constructor(
    @Inject(ELECTORATE_DATA_REPOSITORY)
    private readonly electorateData: ElectorateDataRepository,
  ) {}

  async assertWithinOwnershipRegister(
    tenantId: string,
    mode: VoteMode,
    meetingDate: Date | null | undefined,
  ): Promise<void> {
    if (mode !== VoteMode.ASSEMBLY_RECORD || !meetingDate) return;

    // An empty register is a different situation, and not one this guard can
    // improve: the association has no units on record at all.
    const registerStart =
      await this.electorateData.findOwnershipRegisterStart(tenantId);
    if (registerStart && meetingDate < registerStart) {
      throw new AssemblyMeetingBeforeOwnershipRecordsException(
        formatAssociationDate(registerStart),
      );
    }
  }
}
