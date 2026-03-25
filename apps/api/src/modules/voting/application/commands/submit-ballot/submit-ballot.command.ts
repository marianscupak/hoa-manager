export class SubmitBallotCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly membershipId: string,
    public readonly ballots: {
      unitId: string;
      answers: { questionId: string; optionId: string }[];
    }[],
  ) {}
}
