export interface ResultCalculationElectorateData {
  unitId: string;
  eligibilityStatus: string;
  votingWeight: string;
}

export interface ResultCalculationBallotData {
  ballotId: string;
  unitId: string;
}

export interface ResultCalculationAnswerData {
  ballotId: string;
  questionId: string;
  optionId: string;
}

export interface ResultCalculationDataRepository {
  findElectorateSnapshot(
    tenantId: string,
    voteId: string,
  ): Promise<ResultCalculationElectorateData[]>;
  findBallots(
    tenantId: string,
    voteId: string,
  ): Promise<ResultCalculationBallotData[]>;
  findBallotAnswers(
    ballotIds: string[],
  ): Promise<ResultCalculationAnswerData[]>;
}

export const RESULT_CALCULATION_DATA_REPOSITORY = Symbol(
  'RESULT_CALCULATION_DATA_REPOSITORY',
);
