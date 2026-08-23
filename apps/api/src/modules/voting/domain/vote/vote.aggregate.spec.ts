import { addDays, addMilliseconds } from 'date-fns';

import {
  InvalidVoteQuestionException,
  RulesetOverrideNotStricterException,
  VoteNotDraftException,
  VoteRulesetRequiredException,
  VoteScheduleInPastException,
  VoteScheduleInvalidRangeException,
  VoteNotScheduledException,
  VoteNotReadyToOpenException,
} from '@/shared/application/exceptions/vote.exceptions';

import { VoteAggregate, type CreateVoteInput } from './vote.aggregate';
import {
  MajorityDenominatorBasis,
  MajorityRuleType,
  ThresholdComparator,
  VoteMode,
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

  // Statutory per-rollam defaults: no quorum, simple majority of all votes.
  const createValidRuleset = (opts?: Partial<VoteRuleset>): VoteRuleset => ({
    weightBasis: VoteWeightBasis.UNIT_SHARE,
    quorum: null,
    majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
    majorityDenominatorBasis: MajorityDenominatorBasis.ALL_VOTES,
    majorityThreshold: { num: 1, den: 2 },
    majorityComparator: ThresholdComparator.STRICT_GREATER,
    allowAbstain: false,
    acknowledgedNonStatutory: false,
    ...opts,
  });

  /** A strictly higher bar than the default — a legal question override. */
  const createStricterRuleset = (opts?: Partial<VoteRuleset>): VoteRuleset =>
    createValidRuleset({
      majorityRuleType: MajorityRuleType.QUALIFIED_MAJORITY,
      majorityThreshold: { num: 2, den: 3 },
      majorityComparator: ThresholdComparator.AT_LEAST,
      ...opts,
    });

  const createDraftAggregate = () =>
    VoteAggregate.create(
      {
        title: 'Test',
        description: 'Test',
        mode: VoteMode.PER_ROLLAM,
        // Per rollam requires at least a 15-day window.
        scheduledFrom: defaultNow,
        scheduledTo: addDays(defaultNow, 20),
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
        mode: VoteMode.PER_ROLLAM,
        scheduledFrom: defaultNow,
        scheduledTo: addDays(defaultNow, 20),
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
      expect(aggregate.mode).toBe(VoteMode.PER_ROLLAM);
      expect(aggregate.createdByMembershipId).toBe(defaultMembershipId);
      expect(aggregate.createdAt).toEqual(defaultNow);
      expect(aggregate.ruleset).toBeUndefined();
      expect(aggregate.questions).toEqual([]);
    });

    it('throws VoteScheduleInPastException if scheduledFrom is in the past', () => {
      const data: CreateVoteInput = {
        title: 'Test Vote',
        description: 'Desc',
        mode: VoteMode.PER_ROLLAM,
        scheduledFrom: addMilliseconds(defaultNow, -1),
        scheduledTo: addDays(defaultNow, 20),
      };

      expect(() => {
        VoteAggregate.create(
          data,
          defaultTenantId,
          defaultMembershipId,
          defaultNow,
        );
      }).toThrow(VoteScheduleInPastException);
    });

    it('throws VoteScheduleInvalidRangeException if scheduledTo is before scheduledFrom', () => {
      const data: CreateVoteInput = {
        title: 'Test Vote',
        description: 'Desc',
        mode: VoteMode.PER_ROLLAM,
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
      }).toThrow(VoteScheduleInvalidRangeException);
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
        mode: VoteMode.PER_ROLLAM,
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
      aggregate.setRuleset(createValidRuleset({ allowAbstain: false }));
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      aggregate.setRuleset(createStricterRuleset({ allowAbstain: false }));

      expect(aggregate.ruleset?.majorityRuleType).toBe(
        MajorityRuleType.QUALIFIED_MAJORITY,
      );
      expect(aggregate.ruleset?.majorityThreshold).toEqual({ num: 2, den: 3 });
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

    it('question with a stricter majority override keeps the override', () => {
      aggregate.addQuestion({
        title: 'Q with qualified majority',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createStricterRuleset({ allowAbstain: false }),
      });

      const q = aggregate.questions[0];
      expect(q.rulesetOverride).toBeDefined();
      expect(q.rulesetOverride!.majorityThreshold).toEqual({ num: 2, den: 3 });
      expect(q.options).toHaveLength(2);
    });

    it('rejects an override that relaxes a dimension it may not touch', () => {
      // allowAbstain is not a "strictness" dimension — diverging from the
      // vote-level ruleset is not allowed at all.
      expect(() =>
        aggregate.addQuestion({
          title: 'Q suppressing abstain',
          description: null,
          type: VoteQuestionType.YES_NO,
          rulesetOverride: createStricterRuleset({ allowAbstain: true }),
        }),
      ).toThrow(RulesetOverrideNotStricterException);
    });

    it('override inherits the vote-level abstain option', () => {
      aggregate.setRuleset(createValidRuleset({ allowAbstain: true }));

      aggregate.addQuestion({
        title: 'Q with abstain',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createStricterRuleset({ allowAbstain: true }),
      });

      const q = aggregate.questions[0];
      expect(q.options).toHaveLength(3); // YES, NO, ABSTAIN
      expect(q.options[2].optionKey).toBe(VoteOptionSemantic.ABSTAIN);
    });

    it('multiple questions can have different overrides independently', () => {
      aggregate.addQuestion({
        title: 'Q1 no override',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      aggregate.addQuestion({
        title: 'Q2 two-thirds',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createStricterRuleset({ allowAbstain: false }),
      });

      aggregate.addQuestion({
        title: 'Q3 unanimity',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createValidRuleset({
          allowAbstain: false,
          majorityRuleType: MajorityRuleType.UNANIMITY,
          majorityThreshold: { num: 1, den: 1 },
          majorityComparator: ThresholdComparator.AT_LEAST,
        }),
      });

      const [q1, q2, q3] = aggregate.questions;

      expect(q1.rulesetOverride).toBeUndefined();
      expect(q2.rulesetOverride!.majorityRuleType).toBe(
        MajorityRuleType.QUALIFIED_MAJORITY,
      );
      expect(q2.rulesetOverride!.majorityThreshold).toEqual({ num: 2, den: 3 });
      expect(q3.rulesetOverride!.majorityRuleType).toBe(
        MajorityRuleType.UNANIMITY,
      );
    });

    it('updateQuestion preserves override when provided', () => {
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createStricterRuleset({ allowAbstain: false }),
      });

      const q = aggregate.questions[0];

      aggregate.updateQuestion(q.id, {
        title: 'Q1 updated',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createStricterRuleset({ allowAbstain: false }),
      });

      const updated = aggregate.questions[0];
      expect(updated.title).toBe('Q1 updated');
      expect(updated.rulesetOverride!.majorityThreshold).toEqual({
        num: 2,
        den: 3,
      });
    });

    it('updateQuestion can remove override by not passing it', () => {
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createStricterRuleset({ allowAbstain: false }),
      });

      const q = aggregate.questions[0];

      // Update without override → falls back to vote-level default
      aggregate.updateQuestion(q.id, {
        title: 'Q1 updated',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      const updated = aggregate.questions[0];
      expect(updated.rulesetOverride).toBeUndefined();
    });

    it('updateQuestion can add override to previously un-overridden question', () => {
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      const q = aggregate.questions[0];

      aggregate.updateQuestion(q.id, {
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: createStricterRuleset({ allowAbstain: false }),
      });

      const updated = aggregate.questions[0];
      expect(updated.rulesetOverride!.majorityComparator).toBe(
        ThresholdComparator.AT_LEAST,
      );
    });

    it('SINGLE_CHOICE question respects the effective ruleset for abstain', () => {
      aggregate.setRuleset(createValidRuleset({ allowAbstain: true }));

      aggregate.addQuestion({
        title: 'Pick one',
        description: null,
        type: VoteQuestionType.SINGLE_CHOICE,
        options: [{ label: 'A' }, { label: 'B' }],
        rulesetOverride: createStricterRuleset({ allowAbstain: true }),
      });

      const q = aggregate.questions[0];
      expect(q.options).toHaveLength(3); // A, B, ABSTAIN
      expect(q.options[2].optionKey).toBe(VoteOptionSemantic.ABSTAIN);
    });

    it('rehydrate preserves rulesetOverride on questions', () => {
      const override = createStricterRuleset({ allowAbstain: false });

      const rehydrated = VoteAggregate.rehydrate({
        id: 'v1',
        tenantId: defaultTenantId,
        title: 'Vote',
        description: 'Desc',
        status: VoteStatus.DRAFT,
        mode: VoteMode.PER_ROLLAM,
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

  describe('open()', () => {
    let aggregate: VoteAggregate;

    beforeEach(() => {
      aggregate = createDraftAggregate();
      aggregate.setRuleset(createValidRuleset());
      aggregate.addQuestion({
        title: 'Q1',
        description: null,
        type: VoteQuestionType.YES_NO,
      });
    });

    it('transitions from SCHEDULED to OPEN if scheduled time has arrived', () => {
      aggregate.schedule(defaultNow);

      const openTime = addDays(defaultNow, 0.5); // ScheduledFrom is defaultNow
      aggregate.open(defaultMembershipId, openTime);

      expect(aggregate.status).toBe(VoteStatus.OPEN);
      expect(aggregate.openedAt).toEqual(openTime);
      expect(aggregate.openedByMembershipId).toBe(defaultMembershipId);
    });

    it('throws VoteNotScheduledException if not in SCHEDULED status', () => {
      // It's in DRAFT here
      expect(() => {
        aggregate.open(defaultMembershipId, defaultNow);
      }).toThrow(VoteNotScheduledException);
    });

    it('throws VoteNotReadyToOpenException if opening before scheduledFrom', () => {
      const scheduledFrom = addDays(defaultNow, 1);
      const scheduledTo = addDays(defaultNow, 20);

      const futureVote = VoteAggregate.create(
        {
          title: 'Test',
          description: 'Test',
          mode: VoteMode.PER_ROLLAM,
          scheduledFrom,
          scheduledTo,
        },
        defaultTenantId,
        defaultMembershipId,
        defaultNow,
      );
      futureVote.setRuleset(createValidRuleset());
      futureVote.addQuestion({
        title: 'Q',
        description: null,
        type: VoteQuestionType.YES_NO,
      });

      futureVote.schedule(defaultNow);

      const tooEarly = addDays(defaultNow, 0.5);
      expect(() => {
        futureVote.open(defaultMembershipId, tooEarly);
      }).toThrow(VoteNotReadyToOpenException);
    });

    it('supports automated opening with undefined membershipId', () => {
      aggregate.schedule(defaultNow);

      aggregate.open(undefined, defaultNow);

      expect(aggregate.status).toBe(VoteStatus.OPEN);
      expect(aggregate.openedByMembershipId).toBeUndefined();
    });
  });
});

const statutoryPerRollam = {
  weightBasis: VoteWeightBasis.UNIT_SHARE,
  quorum: null,
  majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
  majorityDenominatorBasis: MajorityDenominatorBasis.ALL_VOTES,
  majorityThreshold: { num: 1, den: 2 },
  majorityComparator: ThresholdComparator.STRICT_GREATER,
  allowAbstain: true,
  acknowledgedNonStatutory: false,
};

describe('VoteAggregate — modes and tiered validation', () => {
  const now = new Date('2026-08-22T10:00:00Z');
  const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

  it('defaults to PER_ROLLAM and rejects a 14-day window at schedule time', () => {
    const vote = VoteAggregate.create(
      {
        title: 'T',
        description: null,
        mode: VoteMode.PER_ROLLAM,
        scheduledFrom: days(1),
        scheduledTo: days(15),
      },
      't1',
      'm1',
      now,
    );
    vote.setRuleset(statutoryPerRollam);
    vote.addQuestion({
      title: 'Q',
      description: null,
      type: VoteQuestionType.YES_NO,
    });
    expect(() => vote.schedule(now)).toThrow(
      expect.objectContaining({
        code: 'INCOMPLETE_VOTE',
        details: expect.arrayContaining([
          expect.objectContaining({ code: 'VOTE_WINDOW_TOO_SHORT_PER_ROLLAM' }),
        ]),
      }),
    );
  });

  it('accepts a 15-day window', () => {
    const vote = VoteAggregate.create(
      {
        title: 'T',
        description: null,
        mode: VoteMode.PER_ROLLAM,
        scheduledFrom: days(1),
        scheduledTo: days(16),
      },
      't1',
      'm1',
      now,
    );
    vote.setRuleset(statutoryPerRollam);
    vote.addQuestion({
      title: 'Q',
      description: null,
      type: VoteQuestionType.YES_NO,
    });
    expect(() => vote.schedule(now)).not.toThrow();
  });

  it('rejects sub-legal rulesets with the citation (tier 1)', () => {
    const vote = VoteAggregate.create(
      { title: 'T', description: null, mode: VoteMode.PER_ROLLAM },
      't1',
      'm1',
      now,
    );
    expect(() =>
      vote.setRuleset({
        ...statutoryPerRollam,
        majorityDenominatorBasis: MajorityDenominatorBasis.VOTES_CAST,
      }),
    ).toThrow(expect.objectContaining({ code: 'VOTE_RULESET_SUBLEGAL' }));
  });

  it('requires acknowledgement for tier-3 deviations and accepts it when set', () => {
    const vote = VoteAggregate.create(
      { title: 'T', description: null, mode: VoteMode.PER_ROLLAM },
      't1',
      'm1',
      now,
    );
    const oneUnit = {
      ...statutoryPerRollam,
      weightBasis: VoteWeightBasis.ONE_UNIT_ONE_VOTE,
    };
    expect(() => vote.setRuleset(oneUnit)).toThrow(
      expect.objectContaining({ code: 'VOTE_RULESET_ACK_REQUIRED' }),
    );
    expect(() =>
      vote.setRuleset({ ...oneUnit, acknowledgedNonStatutory: true }),
    ).not.toThrow();
  });

  it('rejects question overrides that relax the vote-level rules', () => {
    const vote = VoteAggregate.create(
      { title: 'T', description: null, mode: VoteMode.PER_ROLLAM },
      't1',
      'm1',
      now,
    );
    vote.setRuleset({
      ...statutoryPerRollam,
      majorityRuleType: MajorityRuleType.QUALIFIED_MAJORITY,
      majorityThreshold: { num: 2, den: 3 },
      majorityComparator: ThresholdComparator.AT_LEAST,
    });
    expect(() =>
      vote.addQuestion({
        title: 'Q',
        description: null,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: statutoryPerRollam,
      }),
    ).toThrow(
      expect.objectContaining({ code: 'VOTE_RULESET_OVERRIDE_NOT_STRICTER' }),
    );
  });
});
