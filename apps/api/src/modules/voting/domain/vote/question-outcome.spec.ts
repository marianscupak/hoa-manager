import { deriveQuestionOutcome } from './question-outcome';
import { VoteOptionSemantic, VoteQuestionType } from './vote.types';

describe('deriveQuestionOutcome', () => {
  it('returns NOT_DECIDED when quorum was not met, regardless of majority', () => {
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.YES_NO,
        quorumMet: false,
        majorityMet: true,
        winningOptionKey: VoteOptionSemantic.YES,
      }),
    ).toBe('NOT_DECIDED');
  });

  it('passes a null quorum (per rollam) through to the majority logic', () => {
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.YES_NO,
        quorumMet: null,
        majorityMet: true,
        winningOptionKey: VoteOptionSemantic.YES,
      }),
    ).toBe('APPROVED');
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.YES_NO,
        quorumMet: null,
        majorityMet: false,
        winningOptionKey: null,
      }),
    ).toBe('REJECTED');
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.SINGLE_CHOICE,
        quorumMet: null,
        majorityMet: true,
        winningOptionKey: VoteOptionSemantic.CUSTOM,
      }),
    ).toBe('WINNER');
  });

  it('returns APPROVED for a yes/no question when YES wins the majority', () => {
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.YES_NO,
        quorumMet: true,
        majorityMet: true,
        winningOptionKey: VoteOptionSemantic.YES,
      }),
    ).toBe('APPROVED');
  });

  it('returns REJECTED for a yes/no question when NO wins the majority', () => {
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.YES_NO,
        quorumMet: true,
        majorityMet: true,
        winningOptionKey: VoteOptionSemantic.NO,
      }),
    ).toBe('REJECTED');
  });

  it('returns REJECTED for a yes/no question when no option reached the majority', () => {
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.YES_NO,
        quorumMet: true,
        majorityMet: false,
        winningOptionKey: null,
      }),
    ).toBe('REJECTED');
  });

  it('returns WINNER for a single-choice question with a majority winner', () => {
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.SINGLE_CHOICE,
        quorumMet: true,
        majorityMet: true,
        winningOptionKey: VoteOptionSemantic.CUSTOM,
      }),
    ).toBe('WINNER');
  });

  it('returns NOT_DECIDED for a single-choice question without a majority winner (tie or below threshold)', () => {
    expect(
      deriveQuestionOutcome({
        questionType: VoteQuestionType.SINGLE_CHOICE,
        quorumMet: true,
        majorityMet: false,
        winningOptionKey: null,
      }),
    ).toBe('NOT_DECIDED');
  });
});
