import { InvalidBallotAnswersException } from '@/shared/application/exceptions/vote.exceptions';

import { assertAnswersMatchQuestions } from './ballot-answers';

describe('assertAnswersMatchQuestions', () => {
  const questions = [
    { id: 'q1', options: [{ id: 'o1' }, { id: 'o2' }] },
    { id: 'q2', options: [{ id: 'o3' }, { id: 'o4' }] },
  ];

  it('accepts one valid answer per question', () => {
    expect(() =>
      assertAnswersMatchQuestions(questions, [
        { questionId: 'q1', optionId: 'o1' },
        { questionId: 'q2', optionId: 'o4' },
      ]),
    ).not.toThrow();
  });

  it('rejects a missing question', () => {
    expect(() =>
      assertAnswersMatchQuestions(questions, [
        { questionId: 'q1', optionId: 'o1' },
      ]),
    ).toThrow(InvalidBallotAnswersException);
  });

  it('rejects the same question answered twice', () => {
    expect(() =>
      assertAnswersMatchQuestions(questions, [
        { questionId: 'q1', optionId: 'o1' },
        { questionId: 'q1', optionId: 'o2' },
      ]),
    ).toThrow(InvalidBallotAnswersException);
  });

  it('rejects an option from another question', () => {
    expect(() =>
      assertAnswersMatchQuestions(questions, [
        { questionId: 'q1', optionId: 'o3' },
        { questionId: 'q2', optionId: 'o4' },
      ]),
    ).toThrow(InvalidBallotAnswersException);
  });

  it('rejects an unknown question id', () => {
    expect(() =>
      assertAnswersMatchQuestions(questions, [
        { questionId: 'q9', optionId: 'o1' },
        { questionId: 'q2', optionId: 'o4' },
      ]),
    ).toThrow(InvalidBallotAnswersException);
  });

  it('rejects an extra answer when every question is already covered', () => {
    // The inline validation this replaced gated only on the count of DISTINCT
    // question ids, so this slipped through and wrote two ballot_answers rows
    // for q1 — double-counting the unit on that question.
    expect(() =>
      assertAnswersMatchQuestions(questions, [
        { questionId: 'q1', optionId: 'o1' },
        { questionId: 'q1', optionId: 'o2' },
        { questionId: 'q2', optionId: 'o3' },
      ]),
    ).toThrow(InvalidBallotAnswersException);
  });
});
