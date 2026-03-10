import { type CreateVoteDto } from '@/modules/voting/api/dto/vote.dto';
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
  InvalidVoteScheduleException,
  RulesetChangeBlockedException,
  VoteNotDraftException,
  VoteQuestionNotFoundException,
  VoteRulesetRequiredException,
} from '@/shared/application/exceptions/vote.exceptions';

export type AddVoteQuestionInput = {
  title: string;
  description: string | null;
  type: VoteQuestionType;
  sortOrder?: number;
  options?: { label: string; sortOrder?: number }[];
};

export type UpdateVoteQuestionInput = AddVoteQuestionInput;

export class VoteAggregate {
  public questions: VoteQuestion[] = [];

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
    questions?: VoteQuestion[],
  ) {
    if (questions) {
      this.questions = questions;
    }
  }

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

    if (this.questions.length > 0 && this.ruleset) {
      if (this.ruleset.allowAbstain !== ruleset.allowAbstain) {
        throw new RulesetChangeBlockedException();
      }
    }

    this.ruleset = ruleset;
  }

  addQuestion(input: AddVoteQuestionInput): void {
    this.assertEditable();
    const ruleset = this.assertRulesetPresent();

    if (!input.title || input.title.trim() === '') {
      throw new InvalidVoteQuestionException();
    }

    const options = this.buildOptionsForQuestion(
      input.type,
      ruleset.allowAbstain,
      input.options,
    );

    const question: VoteQuestion = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      type: input.type,
      sortOrder: 0, // Assigned correctly during normalization
      options,
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

    const updatedQuestion = {
      id: questionId,
      title: input.title,
      description: input.description,
      type: input.type,
      sortOrder: 0,
      options,
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

  private buildAbstainOption(sortOrder: number): VoteOption {
    return {
      id: crypto.randomUUID(),
      label: 'Zdržel se',
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
        label: 'Pro',
        sortOrder: 1,
        optionKey: VoteOptionSemantic.YES,
      });
      defaultOptions.push({
        id: crypto.randomUUID(),
        label: 'Proti',
        sortOrder: 2,
        optionKey: VoteOptionSemantic.NO,
      });

      if (allowAbstain) {
        defaultOptions.push(this.buildAbstainOption(3));
      }

      return defaultOptions;
    } else if (type === VoteQuestionType.SINGLE_CHOICE) {
      if (!inputOptions || inputOptions.length < 2) {
        throw new InvalidVoteQuestionException();
      }

      const labels = new Set(
        inputOptions.map((o) => o.label.trim().toLowerCase()),
      );
      if (labels.size !== inputOptions.length) {
        throw new InvalidVoteQuestionException();
      }

      const builtOptions: VoteOption[] = [];
      const suppliedInputOptions = [...inputOptions];

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
