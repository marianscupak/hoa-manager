import {
  VoteMode,
  VoteOption,
  VoteOptionSemantic,
  VoteQuestion,
  VoteQuestionType,
  VoteRuleset,
  VoteStatus,
} from '@/modules/voting/domain/vote/vote.types';
import {
  InvalidVoteQuestionException,
  RulesetAcknowledgementRequiredException,
  RulesetOverrideNotStricterException,
  SubLegalRulesetException,
  VoteWindowTooShortPerRollamException,
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

import {
  validateQuestionOverride,
  validateRuleset,
} from './ruleset-validation';

/**
 * Statutory minimum per-rollam voting window — NOZ § 1212 gives owners at
 * least 15 days to return a written ballot.
 */
const PER_ROLLAM_MIN_WINDOW_MS = 15 * 86_400_000;

export type CreateVoteInput = {
  title: string;
  description: string | null;
  mode: VoteMode;
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
    public readonly mode: VoteMode,
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
      data.mode,
      now,
      createdByMembershipId,
      data.scheduledFrom,
      data.scheduledTo,
    );
  }

  update(data: CreateVoteInput, now: Date): void {
    this.assertEditable();
    VoteAggregate.validateSchedule(data.scheduledFrom, data.scheduledTo, now);
    if (
      this.mode === VoteMode.PER_ROLLAM &&
      data.scheduledFrom &&
      data.scheduledTo &&
      data.scheduledTo.getTime() - data.scheduledFrom.getTime() <
        PER_ROLLAM_MIN_WINDOW_MS
    ) {
      throw new VoteWindowTooShortPerRollamException();
    }

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
      if (this.mode === VoteMode.PER_ROLLAM) {
        const windowMs =
          this.scheduledTo.getTime() - this.scheduledFrom.getTime();
        if (windowMs < PER_ROLLAM_MIN_WINDOW_MS) {
          errors.push({ code: ErrorCode.VOTE_WINDOW_TOO_SHORT_PER_ROLLAM });
        }
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
    mode: VoteMode;
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
      props.mode,
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
    const { tier1, tier3 } = validateRuleset(this.mode, ruleset);
    if (tier1.length > 0) {
      throw new SubLegalRulesetException(
        tier1.map((v) => ({
          code: ErrorCode.VOTE_RULESET_SUBLEGAL,
          param: `${v.code} (${v.citation})`,
        })),
      );
    }
    if (tier3.length > 0 && !ruleset.acknowledgedNonStatutory) {
      throw new RulesetAcknowledgementRequiredException(
        tier3.map((d) => ({
          code: ErrorCode.VOTE_RULESET_ACK_REQUIRED,
          param: d,
        })),
      );
    }
    this.ruleset = ruleset;
  }

  addQuestion(input: AddVoteQuestionInput): void {
    this.assertEditable();
    // A question override may only tighten the majority bar — `allowAbstain`
    // is one of the dimensions it may not diverge on (see
    // `validateQuestionOverride`), so the option set always follows the
    // vote-level ruleset.
    const ruleset = this.assertRulesetPresent();

    if (!input.title || input.title.trim() === '') {
      throw new InvalidVoteQuestionException();
    }

    const options = this.buildOptionsForQuestion(
      input.type,
      ruleset.allowAbstain,
      input.options,
    );

    this.assertQuestionOverrideStricter(input.rulesetOverride);

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
    // A question override may only tighten the majority bar — `allowAbstain`
    // is one of the dimensions it may not diverge on (see
    // `validateQuestionOverride`), so the option set always follows the
    // vote-level ruleset.
    const ruleset = this.assertRulesetPresent();

    const currentIndex = this.questions.findIndex((q) => q.id === questionId);
    if (currentIndex === -1) {
      throw new VoteQuestionNotFoundException();
    }

    if (!input.title || input.title.trim() === '') {
      throw new InvalidVoteQuestionException();
    }

    const options = this.buildOptionsForQuestion(
      input.type,
      ruleset.allowAbstain,
      input.options,
    );

    this.assertQuestionOverrideStricter(input.rulesetOverride);

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

  private assertQuestionOverrideStricter(
    override: VoteRuleset | undefined,
  ): void {
    if (!override) return;
    const base = this.assertRulesetPresent();
    const check = validateQuestionOverride(this.mode, base, override);
    if (check.notStricter) throw new RulesetOverrideNotStricterException();
    if (check.tier1.length > 0) {
      throw new SubLegalRulesetException(
        check.tier1.map((v) => ({
          code: ErrorCode.VOTE_RULESET_SUBLEGAL,
          param: `${v.code} (${v.citation})`,
        })),
      );
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
