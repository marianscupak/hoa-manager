import { type CreateVoteDto } from '@/modules/voting/api/dto/vote.dto';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import { InvalidVoteScheduleException } from '@/shared/application/exceptions/vote.exceptions';

export class VoteAggregate {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly status: VoteStatus,
    public readonly createdAt: Date,
    public readonly createdByMembershipId: string,
    public readonly scheduledFrom?: Date,
    public readonly scheduledTo?: Date,
    public readonly openedAt?: Date,
    public readonly openedByMembershipId?: string,
    public readonly closedAt?: Date,
    public readonly closedByMembershipId?: string,
    public readonly updatedAt?: Date,
  ) {}

  static create(
    data: CreateVoteDto,
    tenantId: string,
    createdByMembershipId: string,
    now: Date,
  ): VoteAggregate {
    if (
      (data.scheduledFrom && data.scheduledFrom < now) ||
      (data.scheduledTo && data.scheduledTo < now) ||
      (data.scheduledFrom &&
        data.scheduledTo &&
        data.scheduledFrom >= data.scheduledTo)
    ) {
      throw new InvalidVoteScheduleException();
    }

    return new VoteAggregate(
      crypto.randomUUID(),
      tenantId,
      data.title,
      data.description,
      VoteStatus.DRAFT,
      now,
      createdByMembershipId,
      data.scheduledFrom,
      data.scheduledTo,
    );
  }
}
