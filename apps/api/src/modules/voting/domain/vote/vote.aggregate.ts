import { type CreateVoteDto } from '@/modules/voting/api/dto/vote.dto';
import {
  VoteRuleset,
  VoteStatus,
} from '@/modules/voting/domain/vote/vote.types';
import {
  InvalidVoteScheduleException,
  VoteNotDraftException,
} from '@/shared/application/exceptions/vote.exceptions';

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
    public ruleset?: VoteRuleset,
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
    );
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    title: string;
    description: string;
    status: VoteStatus;
    createdAt: Date;
    createdByMembershipId: string;
    scheduledFrom?: Date | null;
    scheduledTo?: Date | null;
    openedAt?: Date | null;
    openedByMembershipId?: string | null;
    closedAt?: Date | null;
    closedByMembershipId?: string | null;
    updatedAt?: Date | null;
    ruleset?: VoteRuleset | null;
  }): VoteAggregate {
    return new VoteAggregate(
      props.id,
      props.tenantId,
      props.title,
      props.description,
      props.status,
      props.createdAt,
      props.createdByMembershipId,
      props.scheduledFrom ?? undefined,
      props.scheduledTo ?? undefined,
      props.openedAt ?? undefined,
      props.openedByMembershipId ?? undefined,
      props.closedAt ?? undefined,
      props.closedByMembershipId ?? undefined,
      props.updatedAt ?? undefined,
      props.ruleset ?? undefined,
    );
  }

  setRuleset(ruleset: VoteRuleset): void {
    if (this.status !== VoteStatus.DRAFT) {
      throw new VoteNotDraftException();
    }

    this.ruleset = ruleset;
  }
}
