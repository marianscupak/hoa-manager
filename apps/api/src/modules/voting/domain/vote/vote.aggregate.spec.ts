import { addDays, addMilliseconds } from 'date-fns';

import {
  InvalidVoteQuestionException,
  InvalidVoteScheduleException,
  VoteNotDraftException,
  VoteRulesetRequiredException,
} from '@/shared/application/exceptions/vote.exceptions';

import { VoteAggregate, type CreateVoteInput } from './vote.aggregate';
import {
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteOptionSemantic,
  VoteQuestionType,
  VoteRuleset,
  VoteStatus,
  VoteWeightBasis,
} from './vote.types';

describe('VoteAggregate', () => {
  const defaultTenantId = 'tenant-1';
  const defaultMembershipId = 'member-1';
  const defaultNow = new Date('2024-01-01T12:00:00Z');

  const createValidRuleset = (opts?: Partial<VoteRuleset>): VoteRuleset => ({
    weightBasis: VoteWeightBasis.ONE_UNIT_ONE_VOTE,
    quorumMeasure: QuorumMeasure.UNIT_COUNT,
    quorumElectorateBasis: QuorumElectorateBasis.ALL_UNITS,
    quorumThreshold: 10,
    majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
    majorityThreshold: null,
    allowAbstain: false,
    abstainExcludedFromMajorityDenominator: true,
    allowCoOwnerIndividualVote: false,
    ...opts,
  });

  const createDraftAggregate = () =>
    VoteAggregate.create(
      {
        title: 'Test',
        description: 'Test',
        scheduledFrom: defaultNow,
        scheduledTo: addDays(defaultNow, 1),
      },
      defaultTenantId,
      defaultMembershipId,
      defaultNow,
    );

  describe('create()', () => {
    it('creates a draft vote aggregate with correct properties', () => {
      const data: CreateVoteInput = {
        title: 'Test Vote',
        description: 'Test description',
        scheduledFrom: defaultNow,
        scheduledTo: addDays(defaultNow, 1),
      };

      const aggregate = VoteAggregate.create(
        data,
        defaultTenantId,
        defaultMembershipId,
        defaultNow,
      );

      expect(aggregate.id).toBeDefined();
      expect(aggregate.tenantId).toBe(defaultTenantId);
      expect(aggregate.title).toBe(data.title);
      expect(aggregate.description).toBe(data.description);
      expect(aggregate.status).toBe(VoteStatus.DRAFT);
      expect(aggregate.createdByMembershipId).toBe(defaultMembershipId);
      expect(aggregate.createdAt).toEqual(defaultNow);
      expect(aggregate.ruleset).toBeUndefined();
      expect(aggregate.questions).toEqual([]);
    });

    it('throws InvalidVoteScheduleException if scheduledFrom is in the past', () => {
      const data: CreateVoteInput = {
        title: 'Test Vote',
        description: 'Desc',
        scheduledFrom: addMilliseconds(defaultNow, -1),
        scheduledTo: addDays(defaultNow, 1),
      };

      expect(() => {
        VoteAggregate.create(
          data,
          defaultTenantId,
          defaultMembershipId,
          defaultNow,
        );
      }).toThrow(InvalidVoteScheduleException);
    });

    it('throws InvalidVoteScheduleException if scheduledTo is before scheduledFrom', () => {
      const data: CreateVoteInput = {
        title: 'Test Vote',
        description: 'Desc',
        scheduledFrom: addDays(defaultNow, 1),
        scheduledTo: defaultNow,
      };

      expect(() => {
        VoteAggregate.create(
          data,
          defaultTenantId,
          defaultMembershipId,
          defaultNow,
        );
      }).toThrow(InvalidVoteScheduleException);
    });
  });

  describe('setRuleset()', () => {
    it('sets the ruleset if vote is draft and no questions exist', () => {
      const aggregate = createDraftAggregate();
      const ruleset = createValidRuleset();
      aggregate.setRuleset(ruleset);

      expect(aggregate.ruleset).toEqual(ruleset);
    });

    it('throws VoteNotDraftException if vote is not in DRAFT status', () => {
      const aggregate = VoteAggregate.rehydrate({
        id: '1',
        title: 'Title',
        description: 'Desc',
        tenantId: '1',
        createdByMembershipId: '1',
        createdAt: defaultNow,
        status: VoteStatus.OPEN,
      });

      expect(() => {
        aggregate.setRuleset(createValidRuleset());
      }).toThrow(VoteNotDraftException);
    });

    it('allows changing allowAbstain on vote-level ruleset even when questions exist', () => {
      const aggregate = createDraftAggregate();
      aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      expect(() => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: true }));
      }).not.toThrow();

      expect(aggregate.ruleset?.allowAbstain).toBe(true);
    });

    it('allows changing other ruleset fields when questions exist', () => {
      const aggregate = createDraftAggregate();
      aggregate.setRuleset(
        createValidRuleset({ allowAbstain: false, quorumThreshold: 10 }),
      );
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      aggregate.setRuleset(
        createValidRuleset({ allowAbstain: false, quorumThreshold: 20 }),
      );

      expect(aggregate.ruleset?.quorumThreshold).toBe(20);
    });
  });

  describe('Questions and Options', () => {
    let aggregate: VoteAggregate;

    beforeEach(() => {
      aggregate = createDraftAggregate();
    });

    it('throws VoteRulesetRequiredException if trying to add question before setting ruleset', () => {
      expect(() => {
        aggregate.addQuestion({
          title: 'Q',
          description: null,
          type: VoteQuestionType.YES_NO,
        });
      }).toThrow(VoteRulesetRequiredException);
    });

    describe('YES_NO question', () => {
      it('creates correct standard options automatically', () => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));

        aggregate.addQuestion({
          title: 'Do you agree?',
          description: null,
          type: VoteQuestionType.YES_NO,
        });

        expect(aggregate.questions).toHaveLength(1);
        const q = aggregate.questions[0];
        expect(q.sortOrder).toBe(1);
        expect(q.title).toBe('Do you agree?');
        expect(q.options).toHaveLength(2);

        expect(q.options[0].label).toBe('YES');
        expect(q.options[0].sortOrder).toBe(1);
        expect(q.options[0].optionKey).toBe(VoteOptionSemantic.YES);

        expect(q.options[1].label).toBe('NO');
        expect(q.options[1].sortOrder).toBe(2);
        expect(q.options[1].optionKey).toBe(VoteOptionSemantic.NO);
      });

      it('adds abstain option if allowed by vote-level default', () => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: true }));

        aggregate.addQuestion({
          title: 'Do you agree?',
          description: null,
          type: VoteQuestionType.YES_NO,
        });

        const q = aggregate.questions[0];
        expect(q.options).toHaveLength(3);
        expect(q.options[2].label).toBe('ABSTAIN');
        expect(q.options[2].sortOrder).toBe(3);
        expect(q.options[2].optionKey).toBe(VoteOptionSemantic.ABSTAIN);
      });

      it('throws InvalidVoteQuestionException if custom options are passed to YES_NO', () => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));

        expect(() => {
          aggregate.addQuestion({
            title: 'Do you agree?',
            description: null,
            type: VoteQuestionType.YES_NO,
            options: [{ label: 'Custom' }],
          });
        }).toThrow(InvalidVoteQuestionException);
      });
    });

    describe('SINGLE_CHOICE question', () => {
      it('creates custom options and properly sorts by input sortOrder and renormalizes', () => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));

        aggregate.addQuestion({
          title: 'Choose a color',
          description: null,
          type: VoteQuestionType.SINGLE_CHOICE,
          options: [
            { label: 'Blue', sortOrder: 3 },
            { label: 'Red', sortOrder: 1 },
            { label: 'Green', sortOrder: 2 },
          ],
        });

        const q = aggregate.questions[0];
        expect(q.options).toHaveLength(3);

        // Output should be strictly sequential starting from 1
        expect(q.options[0].label).toBe('Red');
        expect(q.options[0].sortOrder).toBe(1);
        expect(q.options[0].optionKey).toBe(VoteOptionSemantic.CUSTOM);

        expect(q.options[1].label).toBe('Green');
        expect(q.options[1].sortOrder).toBe(2);
        expect(q.options[1].optionKey).toBe(VoteOptionSemantic.CUSTOM);

        expect(q.options[2].label).toBe('Blue');
        expect(q.options[2].sortOrder).toBe(3);
        expect(q.options[2].optionKey).toBe(VoteOptionSemantic.CUSTOM);
      });

      it('allows fewer than 2 distinct options', () => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));

        expect(() => {
          aggregate.addQuestion({
            title: 'Color',
            description: null,
            type: VoteQuestionType.SINGLE_CHOICE,
            options: [{ label: '1' }],
          });
        }).not.toThrow(InvalidVoteQuestionException);
      });

      it('allows options to share duplicate labels', () => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));

        expect(() => {
          aggregate.addQuestion({
            title: 'Color',
            description: null,
            type: VoteQuestionType.SINGLE_CHOICE,
            options: [
              { label: 'Red', sortOrder: 1 },
              { label: '  red ', sortOrder: 2 }, // case-insensitive + whitespace
            ],
          });
        }).not.toThrow(InvalidVoteQuestionException);
      });

      it('adds abstain option correctly formatted to the end if allowed', () => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: true }));

        aggregate.addQuestion({
          title: 'Color',
          description: null,
          type: VoteQuestionType.SINGLE_CHOICE,
          options: [{ label: 'Red' }, { label: 'Blue' }],
        });

        const q = aggregate.questions[0];
        expect(q.options).toHaveLength(3);
        expect(q.options[2].label).toBe('ABSTAIN');
        expect(q.options[2].sortOrder).toBe(3);
        expect(q.options[2].optionKey).toBe(VoteOptionSemantic.ABSTAIN);
      });
    });

    describe('Contiguous Ordering updates', () => {
      beforeEach(() => {
        aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));
        aggregate.addQuestion({
          title: 'Q1',
          description: null,
          type: VoteQuestionType.YES_NO,
        });
        aggregate.addQuestion({
          title: 'Q2',
          description: null,
          type: VoteQuestionType.YES_NO,
        });
        aggregate.addQuestion({
          title: 'Q3',
          description: null,
          type: VoteQuestionType.YES_NO,
        });
      });

      it('adds a question to a specific ordered target location and shifts elements', () => {
        aggregate.addQuestion({
          title: 'NEW Q',
          description: null,
          type: VoteQuestionType.YES_NO,
          sortOrder: 2,
        });

        expect(aggregate.questions.map((q) => q.title)).toEqual([
          'Q1',
          'NEW Q',
          'Q2',
          'Q3',
        ]);
        expect(aggregate.questions.map((q) => q.sortOrder)).toEqual([
          1, 2, 3, 4,
        ]); // Continually sequential
      });

      it('updating a questions sortOrder shifts it and renormalizes', () => {
        const targetQ = aggregate.questions.find((q) => q.title === 'Q3')!;

        aggregate.updateQuestion(targetQ.id, {
          title: 'Q3 updated',
          description: null,
          type: VoteQuestionType.YES_NO,
          sortOrder: 1, // Move to front
        });

        expect(aggregate.questions.map((q) => q.title)).toEqual([
          'Q3 updated',
          'Q1',
          'Q2',
        ]);
        expect(aggregate.questions.map((q) => q.sortOrder)).toEqual([1, 2, 3]);
      });

      it('removing a question removes it and shifts remaining sequence up', () => {
        const qToDelete = aggregate.questions.find((q) => q.title === 'Q2')!;

        aggregate.removeQuestion(qToDelete.id);

        expect(aggregate.questions.map((q) => q.title)).toEqual(['Q1', 'Q3']);
        expect(aggregate.questions.map((q) => q.sortOrder)).toEqual([1, 2]);
      });
    });
  });

  describe('Per-question ruleset overrides', () => {
    let aggregate: VoteAggregate;

    beforeEach(() => {
      aggregate = createDraftAggregate();
      aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));
    });

    it('question without override uses vote-level default (no abstain)', () => {
      aggregate.addQuestion({
        title: 'Q without override',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      const q = aggregate.questions[0];
      expect(q.rulesetOverride).toBeUndefined();
      expect(q.options).toHaveLength(2); // YES, NO only
      expect(q.options.map((o) => o.optionKey)).toEqual([
        VoteOptionSemantic.YES,
        VoteOptionSemantic.NO,
      ]);
    });

    it('question with override uses override allowAbstain=true instead of vote-level false', () => {
      aggregate.addQuestion({
        title: 'Q with abstain override',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({ allowAbstain: true }),
      });

      const q = aggregate.questions[0];
      expect(q.rulesetOverride).toBeDefined();
      expect(q.rulesetOverride!.allowAbstain).toBe(true);
      expect(q.options).toHaveLength(3); // YES, NO, ABSTAIN
      expect(q.options[2].optionKey).toBe(VoteOptionSemantic.ABSTAIN);
    });

    it('question with override allowAbstain=false when vote-level is true gets no abstain', () => {
      aggregate.setRuleset(createValidRuleset({ allowAbstain: true }));

      aggregate.addQuestion({
        title: 'Q suppressing abstain',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({ allowAbstain: false }),
      });

      const q = aggregate.questions[0];
      expect(q.rulesetOverride!.allowAbstain).toBe(false);
      expect(q.options).toHaveLength(2); // YES, NO — override suppresses abstain
    });

    it('multiple questions can have different overrides independently', () => {
      aggregate.addQuestion({
        title: 'Q1 no override',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      aggregate.addQuestion({
        title: 'Q2 with abstain',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({ allowAbstain: true }),
      });

      aggregate.addQuestion({
        title: 'Q3 different majority',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({
          allowAbstain: false,
          majorityRuleType: MajorityRuleType.QUALIFIED_MAJORITY,
          majorityThreshold: 66.67,
        }),
      });

      const [q1, q2, q3] = aggregate.questions;

      // Q1: default (no abstain)
      expect(q1.rulesetOverride).toBeUndefined();
      expect(q1.options).toHaveLength(2);

      // Q2: override with abstain
      expect(q2.rulesetOverride!.allowAbstain).toBe(true);
      expect(q2.options).toHaveLength(3);

      // Q3: override with different majority but no abstain
      expect(q3.rulesetOverride!.majorityRuleType).toBe(
        MajorityRuleType.QUALIFIED_MAJORITY,
      );
      expect(q3.rulesetOverride!.majorityThreshold).toBe(66.67);
      expect(q3.options).toHaveLength(2);
    });

    it('updateQuestion preserves override when provided', () => {
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({ allowAbstain: true }),
      });

      const q = aggregate.questions[0];
      expect(q.options).toHaveLength(3);

      aggregate.updateQuestion(q.id, {
        title: 'Q1 updated',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({ allowAbstain: true }),
      });

      const updated = aggregate.questions[0];
      expect(updated.title).toBe('Q1 updated');
      expect(updated.rulesetOverride!.allowAbstain).toBe(true);
      expect(updated.options).toHaveLength(3);
    });

    it('updateQuestion can remove override by not passing it', () => {
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({ allowAbstain: true }),
      });

      const q = aggregate.questions[0];
      expect(q.options).toHaveLength(3);

      // Update without override → falls back to vote-level default
      aggregate.updateQuestion(q.id, {
        title: 'Q1 updated',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      const updated = aggregate.questions[0];
      expect(updated.rulesetOverride).toBeUndefined();
      expect(updated.options).toHaveLength(2); // vote-level allowAbstain=false
    });

    it('updateQuestion can add override to previously un-overridden question', () => {
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      const q = aggregate.questions[0];
      expect(q.options).toHaveLength(2);

      aggregate.updateQuestion(q.id, {
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({ allowAbstain: true }),
      });

      const updated = aggregate.questions[0];
      expect(updated.rulesetOverride!.allowAbstain).toBe(true);
      expect(updated.options).toHaveLength(3);
    });

    it('SINGLE_CHOICE question respects override for abstain option', () => {
      aggregate.addQuestion({
        title: 'Pick one',
        description: null,
        type: VoteQuestionType.SINGLE_CHOICE,
        options: [{ label: 'A' }, { label: 'B' }],
        rulesetOverride: createValidRuleset({ allowAbstain: true }),
      });

      const q = aggregate.questions[0];
      expect(q.options).toHaveLength(3); // A, B, ABSTAIN
      expect(q.options[2].optionKey).toBe(VoteOptionSemantic.ABSTAIN);
    });

    it('rehydrate preserves rulesetOverride on questions', () => {
      const override = createValidRuleset({
        allowAbstain: true,
        majorityRuleType: MajorityRuleType.QUALIFIED_MAJORITY,
        majorityThreshold: 75,
      });

      const rehydrated = VoteAggregate.rehydrate({
        id: 'v1',
        tenantId: defaultTenantId,
        title: 'Vote',
        description: 'Desc',
        status: VoteStatus.DRAFT,
        createdAt: defaultNow,
        createdByMembershipId: defaultMembershipId,
        ruleset: createValidRuleset({ allowAbstain: false }),
        questions: [
          {
            id: 'q1',
            title: 'Q without override',
            description: null,
            type: VoteQuestionType.YES_NO,
            sortOrder: 1,
            options: [],
          },
          {
            id: 'q2',
            title: 'Q with override',
            description: null,
            type: VoteQuestionType.YES_NO,
            sortOrder: 2,
            options: [],
            rulesetOverride: override,
          },
        ],
      });

      expect(rehydrated.questions[0].rulesetOverride).toBeUndefined();
      expect(rehydrated.questions[1].rulesetOverride).toEqual(override);
    });
  });
});
