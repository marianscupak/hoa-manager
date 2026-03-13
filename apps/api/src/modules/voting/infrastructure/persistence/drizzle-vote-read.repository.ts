import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import {
  voteRulesets,
  votes,
  voteQuestions,
  voteOptions,
} from '@/infrastructure/db/schema';
import {
  type VoteDetailResponseDto,
  type VoteListItemResponseDto,
  type VoteQuestionResponseDto,
} from '@/modules/voting/api/dto/vote.dto';
import { type VoteReadRepository } from '@/modules/voting/application/ports/vote-read.repository.port';
import {
  type MajorityRuleType,
  type QuorumElectorateBasis,
  type QuorumMeasure,
  type VoteOptionSemantic,
  type VoteQuestionType,
  type VoteStatus,
  type VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

@Injectable()
export class DrizzleVoteReadRepository implements VoteReadRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findDetailById(
    tenantId: string,
    id: string,
  ): Promise<VoteDetailResponseDto | null> {
    const rows = await this.drizzle.db
      .select({
        vote: votes,
        ruleset: voteRulesets,
      })
      .from(votes)
      .leftJoin(voteRulesets, eq(votes.id, voteRulesets.voteId))
      .where(and(eq(votes.tenantId, tenantId), eq(votes.id, id)))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const { vote, ruleset } = rows[0];

    const questionRows = await this.drizzle.db
      .select()
      .from(voteQuestions)
      .where(
        and(eq(voteQuestions.tenantId, tenantId), eq(voteQuestions.voteId, id)),
      )
      .orderBy(voteQuestions.sortOrder);

    const questionIds = questionRows.map((q) => q.id);
    let optionRows: (typeof voteOptions.$inferSelect)[] = [];

    if (questionIds.length > 0) {
      optionRows = await this.drizzle.db
        .select()
        .from(voteOptions)
        .where(
          and(
            eq(voteOptions.tenantId, tenantId),
            inArray(voteOptions.questionId, questionIds),
          ),
        )
        .orderBy(voteOptions.sortOrder);
    }

    const questions: VoteQuestionResponseDto[] = questionRows.map((q) => {
      const qOptions = optionRows
        .filter((o) => o.questionId === q.id)
        .map((o) => ({
          id: o.id,
          label: o.label,
          sortOrder: o.sortOrder,
          optionKey: o.optionKey as VoteOptionSemantic,
        }));

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.questionType as VoteQuestionType,
        sortOrder: q.sortOrder,
        options: qOptions,
      };
    });

    return {
      id: vote.id,
      title: vote.title,
      description: vote.description ?? null,
      scheduledFrom: vote.scheduledFrom ?? null,
      scheduledTo: vote.scheduledTo ?? null,
      status: vote.status as VoteStatus,
      ruleset: ruleset
        ? {
            weightBasis: ruleset.weightBasis as VoteWeightBasis,
            quorumMeasure: ruleset.quorumMeasure as QuorumMeasure,
            quorumElectorateBasis:
              ruleset.quorumElectorateBasis as QuorumElectorateBasis,
            quorumThreshold: Number(ruleset.quorumThreshold),
            majorityRuleType: ruleset.majorityRuleType as MajorityRuleType,
            majorityThreshold:
              ruleset.majorityThreshold !== null
                ? Number(ruleset.majorityThreshold)
                : null,
            allowAbstain: ruleset.allowAbstain,
            abstainExcludedFromMajorityDenominator:
              ruleset.abstainExcludedFromMajorityDenominator,
          }
        : null,
      questions,
    };
  }

  async findVotes(
    tenantId: string,
    statuses?: VoteStatus[],
  ): Promise<VoteListItemResponseDto[]> {
    const whereClause = statuses && statuses.length > 0
      ? and(eq(votes.tenantId, tenantId), inArray(votes.status, statuses))
      : eq(votes.tenantId, tenantId);

    const rows = await this.drizzle.db
      .select({
        id: votes.id,
        title: votes.title,
        description: votes.description,
        status: votes.status,
        scheduledFrom: votes.scheduledFrom,
        scheduledTo: votes.scheduledTo,
        createdAt: votes.createdAt,
      })
      .from(votes)
      .where(whereClause)
      .orderBy((votes) => [desc(votes.createdAt)]);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      status: row.status as VoteStatus,
      scheduledFrom: row.scheduledFrom ?? null,
      scheduledTo: row.scheduledTo ?? null,
    }));
  }
}

