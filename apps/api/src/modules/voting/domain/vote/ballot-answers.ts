import { InvalidBallotAnswersException } from '@/shared/application/exceptions/vote.exceptions';

export interface BallotQuestion {
  id: string;
  options: { id: string }[];
}

export interface BallotAnswer {
  questionId: string;
  optionId: string;
}

/**
 * A ballot answers every question of its vote exactly once, and every answer
 * names an option that belongs to the question it answers. The length check
 * ensures "exactly once" — just checking distinct questions is insufficient
 * because duplicate answers for the same question could slip through.
 * Shared by the owner booth and by paper-ballot recording so the two cannot
 * drift.
 */
export function assertAnswersMatchQuestions(
  questions: BallotQuestion[],
  answers: BallotAnswer[],
): void {
  const optionIdsByQuestion = new Map(
    questions.map((q) => [q.id, new Set(q.options.map((o) => o.id))]),
  );

  const answered = new Set(answers.map((a) => a.questionId));
  if (
    answered.size !== questions.length ||
    answers.length !== questions.length
  ) {
    throw new InvalidBallotAnswersException();
  }

  for (const answer of answers) {
    const validOptionIds = optionIdsByQuestion.get(answer.questionId);
    if (!validOptionIds || !validOptionIds.has(answer.optionId)) {
      throw new InvalidBallotAnswersException();
    }
  }
}
