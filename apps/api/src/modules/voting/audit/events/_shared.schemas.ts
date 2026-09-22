import { z } from 'zod';

export const BallotAnswerSchema = z.object({
  questionId: z.uuid(),
  optionId: z.uuid(),
});

export const LabeledBallotAnswerSchema = z.object({
  questionText: z.string(),
  optionText: z.string(),
  // Lets the portal translate a standard answer instead of showing the
  // stored "YES". Optional because events written before it existed carry
  // only the label.
  optionKey: z.enum(['YES', 'NO', 'ABSTAIN', 'CUSTOM']).optional(),
});
