import {
  VoteOption,
  VoteOptionSemantic,
  VoteQuestion,
  VoteQuestionType,
  VoteRuleset,
  VoteStatus,
} from '@/modules/voting/domain/vote/vote.types';
import {
  InvalidVoteQuestionException,
  InvalidQuestionRulesetOverrideException,
  VoteNotDraftException,
  VoteQuestionNotFoundException,
  VoteRulesetRequiredException,
  IncompleteVoteException,
  VoteScheduleInPastException,
  VoteScheduleInvalidRangeException,
  VoteNotScheduledException,
  VoteNotReadyToOpenException,
  VoteNotOpenException,
} from '@/shared/application/exceptions/vote.exceptions';
import { ErrorCode } from '@/shared/errors/error-codes';

export type CreateVoteInput = {
  title: string;
  description: string | null;
  scheduledFrom?: Date;
  scheduledTo?: Date;
};

export type AddVoteQuestionInput = {
  title: string;
  description: string | null;
  type: VoteQuestionType;
  sortOrder?: number;
  options?: { label: string; sortOrder?: number }[];
  rulesetOverride?: VoteRuleset;
};

export type UpdateVoteQuestionInput = AddVoteQuestionInput;

export class VoteAggregate {
  public questions: VoteQuestion[] = [];

  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly title: string,
    public readonly description: string | null,
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
    questions?: VoteQuestion[],
  ) {
    if (questions) {
      this.questions = questions;
    }
  }

  static create(
    data: CreateVoteInput,
    tenantId: string,
    createdByMembershipId: string,
    now: Date,
  ): VoteAggregate {
    this.validateSchedule(data.scheduledFrom, data.scheduledTo, now);

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

  update(data: CreateVoteInput, now: Date): void {
    this.assertEditable();
    VoteAggregate.validateSchedule(data.scheduledFrom, data.scheduledTo, now);

    Object.assign(this, {
      title: data.title,
      description: data.description,
      scheduledFrom: data.scheduledFrom,
      scheduledTo: data.scheduledTo,
      updatedAt: now,
    });
  }

  schedule(now: Date): void {
    this.assertEditable();

    const errors: { code: ErrorCode; param?: string }[] = [];

    if (!this.ruleset) {
      errors.push({ code: ErrorCode.VOTE_RULESET_REQUIRED });
    }

    if (!this.scheduledFrom || !this.scheduledTo) {
      errors.push({ code: ErrorCode.VOTE_SCHEDULE_MISSING_DATES });
    } else {
      if (this.scheduledFrom < now) {
        errors.push({ code: ErrorCode.VOTE_SCHEDULE_IN_PAST });
      }
      if (this.scheduledTo < now) {
        errors.push({ code: ErrorCode.VOTE_SCHEDULE_IN_PAST });
      }
      if (this.scheduledFrom >= this.scheduledTo) {
        errors.push({ code: ErrorCode.VOTE_SCHEDULE_INVALID_RANGE });
      }
    }

    if (this.questions.length === 0) {
      errors.push({ code: ErrorCode.VOTE_MISSING_QUESTIONS });
    } else {
      for (const question of this.questions) {
        if (question.options.length < 2) {
          errors.push({
            code: ErrorCode.VOTE_QUESTION_MISSING_OPTIONS,
            param: question.title,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new IncompleteVoteException(errors);
    }

    Object.assign(this, {
      status: VoteStatus.SCHEDULED,
      updatedAt: now,
    });
  }

  open(openedByMembershipId: string | undefined, now: Date): void {
    if (this.status !== VoteStatus.SCHEDULED) {
      throw new VoteNotScheduledException();
    }

    if (!this.scheduledFrom) {
      throw new IncompleteVoteException([
        { code: ErrorCode.VOTE_SCHEDULE_MISSING_DATES },
      ]);
    }

    if (now < this.scheduledFrom) {
      throw new VoteNotReadyToOpenException();
    }

    Object.assign(this, {
      status: VoteStatus.OPEN,
      openedAt: now,
      openedByMembershipId,
      updatedAt: now,
    });
  }

  close(closedByMembershipId: string | undefined, now: Date): void {
    if (this.status !== VoteStatus.OPEN) {
      throw new VoteNotOpenException();
    }

    Object.assign(this, {
      status: VoteStatus.CLOSED,
      closedAt: now,
      closedByMembershipId,
      updatedAt: now,
    });
  }

  private static validateSchedule(
    scheduledFrom: Date | undefined,
    scheduledTo: Date | undefined,
    now: Date,
  ): void {
    if (!scheduledFrom || !scheduledTo) {
      return; // Allow partial dates during draft phase
    }

    if (scheduledFrom < now || scheduledTo < now) {
      throw new VoteScheduleInPastException();
    }

    if (scheduledFrom >= scheduledTo) {
      throw new VoteScheduleInvalidRangeException();
    }
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
    questions?: VoteQuestion[];
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
      props.questions ?? [],
    );
  }

  setRuleset(ruleset: VoteRuleset): void {
    this.assertEditable();
    this.ruleset = ruleset;
  }

  addQuestion(input: AddVoteQuestionInput): void {
    this.assertEditable();
    const defaultRuleset = this.assertRulesetPresent();
    const effectiveRuleset = input.rulesetOverride ?? defaultRuleset;

    if (!input.title || input.title.trim() === '') {
      throw new InvalidVoteQuestionException();
    }

    const options = this.buildOptionsForQuestion(
      input.type,
      effectiveRuleset.allowAbstain,
      input.options,
    );

    this.validateQuestionRulesetOverride(input.rulesetOverride);

    const question: VoteQuestion = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      type: input.type,
      sortOrder: 0, // Assigned correctly during normalization
      options,
      rulesetOverride: input.rulesetOverride,
    };

    let targetIndex = this.questions.length;
    if (input.sortOrder !== undefined) {
      targetIndex =
        Math.max(1, Math.min(input.sortOrder, this.questions.length + 1)) - 1;
    }

    this.questions.splice(targetIndex, 0, question);
    this.normalizeQuestionOrders();
  }

  updateQuestion(questionId: string, input: UpdateVoteQuestionInput): void {
    this.assertEditable();
    const defaultRuleset = this.assertRulesetPresent();
    const effectiveRuleset = input.rulesetOverride ?? defaultRuleset;

    const currentIndex = this.questions.findIndex((q) => q.id === questionId);
    if (currentIndex === -1) {
      throw new VoteQuestionNotFoundException();
    }

    if (!input.title || input.title.trim() === '') {
      throw new InvalidVoteQuestionException();
    }

    const options = this.buildOptionsForQuestion(
      input.type,
      effectiveRuleset.allowAbstain,
      input.options,
    );

    this.validateQuestionRulesetOverride(input.rulesetOverride);

    const updatedQuestion: VoteQuestion = {
      id: questionId,
      title: input.title,
      description: input.description,
      type: input.type,
      sortOrder: 0,
      options,
      rulesetOverride: input.rulesetOverride,
    };

    this.questions.splice(currentIndex, 1);

    let targetIndex: number;
    if (input.sortOrder !== undefined) {
      targetIndex =
        Math.max(1, Math.min(input.sortOrder, this.questions.length + 1)) - 1;
    } else {
      targetIndex = currentIndex;
    }

    this.questions.splice(targetIndex, 0, updatedQuestion);
    this.normalizeQuestionOrders();
  }

  removeQuestion(questionId: string): void {
    this.assertEditable();

    const index = this.questions.findIndex((q) => q.id === questionId);
    if (index === -1) {
      throw new VoteQuestionNotFoundException();
    }

    this.questions.splice(index, 1);
    this.normalizeQuestionOrders();
  }

  private normalizeQuestionOrders(): void {
    for (let i = 0; i < this.questions.length; i++) {
      this.questions[i].sortOrder = i + 1;
    }
  }

  private assertEditable(): void {
    if (this.status !== VoteStatus.DRAFT) {
      throw new VoteNotDraftException();
    }
  }

  private assertRulesetPresent(): VoteRuleset {
    if (!this.ruleset) {
      throw new VoteRulesetRequiredException();
    }
    return this.ruleset;
  }

  private validateQuestionRulesetOverride(
    override: VoteRuleset | undefined,
  ): void {
    if (override && override.allowCoOwnerIndividualVote) {
      throw new InvalidQuestionRulesetOverrideException();
    }
  }

  private buildAbstainOption(sortOrder: number): VoteOption {
    return {
      id: crypto.randomUUID(),
      label: 'ABSTAIN',
      sortOrder,
      optionKey: VoteOptionSemantic.ABSTAIN,
    };
  }

  private buildOptionsForQuestion(
    type: VoteQuestionType,
    allowAbstain: boolean,
    inputOptions?: { label: string; sortOrder?: number }[],
  ): VoteOption[] {
    const defaultOptions: VoteOption[] = [];

    if (type === VoteQuestionType.YES_NO) {
      if (inputOptions && inputOptions.length > 0) {
        throw new InvalidVoteQuestionException();
      }

      defaultOptions.push({
        id: crypto.randomUUID(),
        label: 'YES',
        sortOrder: 1,
        optionKey: VoteOptionSemantic.YES,
      });
      defaultOptions.push({
        id: crypto.randomUUID(),
        label: 'NO',
        sortOrder: 2,
        optionKey: VoteOptionSemantic.NO,
      });

      if (allowAbstain) {
        defaultOptions.push(this.buildAbstainOption(3));
      }

      return defaultOptions;
    } else if (type === VoteQuestionType.SINGLE_CHOICE) {
      const builtOptions: VoteOption[] = [];
      const suppliedInputOptions = [...(inputOptions ?? [])];

      suppliedInputOptions.sort((a, b) => {
        if (a.sortOrder === undefined && b.sortOrder === undefined) return 0;
        if (a.sortOrder === undefined) return 1;
        if (b.sortOrder === undefined) return -1;
        return a.sortOrder - b.sortOrder;
      });

      for (const io of suppliedInputOptions) {
        const option: VoteOption = {
          id: crypto.randomUUID(),
          label: io.label.trim(),
          sortOrder: 0,
          optionKey: VoteOptionSemantic.CUSTOM,
        };

        let targetIndex = builtOptions.length;
        if (io.sortOrder !== undefined) {
          targetIndex =
            Math.max(1, Math.min(io.sortOrder, builtOptions.length + 1)) - 1;
        }

        builtOptions.splice(targetIndex, 0, option);
      }

      for (let i = 0; i < builtOptions.length; i++) {
        builtOptions[i].sortOrder = i + 1;
      }

      if (allowAbstain) {
        const lastSortOrder =
          builtOptions.length > 0
            ? builtOptions[builtOptions.length - 1].sortOrder
            : 0;
        builtOptions.push(this.buildAbstainOption(lastSortOrder + 1));
      }

      return builtOptions;
    }

    return [];
  }
}
