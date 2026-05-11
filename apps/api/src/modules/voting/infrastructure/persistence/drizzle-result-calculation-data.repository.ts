import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  ballotAnswers,
  ballots,
  voteElectorateUnits,
} from '@/infrastructure/db/schema';

import {
  ResultCalculationAnswerData,
  ResultCalculationBallotData,
  ResultCalculationDataRepository,
  ResultCalculationElectorateData,
} from '../../application/ports/result-calculation-data.repository.port';

@Injectable()
export class DrizzleResultCalculationDataRepository implements ResultCalculationDataRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async findElectorateSnapshot(
    tenantId: string,
    voteId: string,
  ): Promise<ResultCalculationElectorateData[]> {
    return await this.db
      .select({
        unitId: voteElectorateUnits.unitId,
        eligibilityStatus: voteElectorateUnits.eligibilityStatus,
        votingWeight: voteElectorateUnits.votingWeight,
      })
      .from(voteElectorateUnits)
      .where(
        and(
          eq(voteElectorateUnits.tenantId, tenantId),
          eq(voteElectorateUnits.voteId, voteId),
        ),
      );
  }

  async findBallots(
    tenantId: string,
    voteId: string,
  ): Promise<ResultCalculationBallotData[]> {
    return await this.db
      .select({
        ballotId: ballots.id,
        unitId: ballots.unitId,
      })
      .from(ballots)
      .where(and(eq(ballots.tenantId, tenantId), eq(ballots.voteId, voteId)));
  }

  async findBallotAnswers(
    ballotIds: string[],
  ): Promise<ResultCalculationAnswerData[]> {
    if (ballotIds.length === 0) return [];

    return await this.db
      .select({
        ballotId: ballotAnswers.ballotId,
        questionId: ballotAnswers.questionId,
        optionId: ballotAnswers.optionId,
      })
      .from(ballotAnswers)
      .where(inArray(ballotAnswers.ballotId, ballotIds));
  }
}
