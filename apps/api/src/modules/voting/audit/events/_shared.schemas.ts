import { z } from 'zod';

export const BallotAnswerSchema = z.object({
  questionId: z.uuid(),
  optionId: z.uuid(),
});

export const LabeledBallotAnswerSchema = z.object({
  questionText: z.string(),
  optionText: z.string(),
});
