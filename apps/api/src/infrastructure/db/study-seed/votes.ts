import { CommandBus } from '@nestjs/cqrs';
import { and, eq } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';

import * as schema from '@/infrastructure/db/schema';
import { AUDIT_CLS_KEYS } from '@/modules/core/audit/infrastructure/cls/audit-context.keys';
import { CloseVoteCommand } from '@/modules/voting/application/commands/close-vote/close-vote.command';
import {
  CreateVoteCommand,
  type CreateVoteResult,
} from '@/modules/voting/application/commands/create-vote/create-vote.command';
import { CreateVoteQuestionCommand } from '@/modules/voting/application/commands/create-vote-question/create-vote-question.command';
import { OpenVoteCommand } from '@/modules/voting/application/commands/open-vote/open-vote.command';
import { ScheduleVoteCommand } from '@/modules/voting/application/commands/schedule-vote/schedule-vote.command';
import { SetVoteRulesetCommand } from '@/modules/voting/application/commands/set-vote-ruleset/set-vote-ruleset.command';
import { SubmitBallotCommand } from '@/modules/voting/application/commands/submit-ballot/submit-ballot.command';
import {
  MajorityDenominatorBasis,
  MajorityRuleType,
  VoteMode,
  VoteQuestionType,
  VoteStatus,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';
import {
  VoteNotOpenException,
  VoteNotScheduledException,
} from '@/shared/application/exceptions/vote.exceptions';

import { type PlanAnswer, type PlanBallot, type PlanVote } from './buildings';
import { type BuiltTenant, type Db, type Voter } from './structure';

export interface VoteDeps {
  db: Db;
  commandBus: CommandBus;
  cls: ClsService;
}

const DAY_MS = 86_400_000;
const daysFrom = (base: Date, days: number) =>
  new Date(base.getTime() + days * DAY_MS);

/** Runs `work` with a USER audit actor in CLS, as an HTTP request would. */
export function runAsUser<T>(
  cls: ClsService,
  actor: Voter,
  work: () => Promise<T>,
): Promise<T> {
  return cls.run(async () => {
    cls.set(AUDIT_CLS_KEYS.actor, {
      type: 'USER',
      userId: actor.userId,
      membershipId: actor.membershipId,
    });
    return work();
  });
}

async function createScheduledVote(
  deps: VoteDeps,
  built: BuiltTenant,
  vote: PlanVote,
  scheduledFrom: Date,
  scheduledTo: Date,
): Promise<string> {
  const { tenantId, admin } = built;
  return runAsUser(deps.cls, admin, async () => {
    const created = await deps.commandBus.execute<
      CreateVoteCommand,
      CreateVoteResult
    >(
      new CreateVoteCommand(tenantId, admin.membershipId, {
        title: vote.title,
        description: vote.description,
        mode: VoteMode.PER_ROLLAM,
        scheduledFrom,
        scheduledTo,
      }),
    );
    await deps.commandBus.execute(
      new SetVoteRulesetCommand(tenantId, created.id, {
        weightBasis: VoteWeightBasis.UNIT_SHARE,
        quorum: null,
        majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
        majorityDenominatorBasis: MajorityDenominatorBasis.ALL_VOTES,
        allowAbstain: true,
        acknowledgedNonStatutory: false,
      }),
    );
    await deps.commandBus.execute(
      new CreateVoteQuestionCommand(tenantId, created.id, admin.membershipId, {
        title: vote.questionTitle,
        description: null,
        type: VoteQuestionType.YES_NO,
      }),
    );
    await deps.commandBus.execute(
      new ScheduleVoteCommand(tenantId, created.id),
    );
    return created.id;
  });
}

async function readStatus(db: Db, voteId: string): Promise<VoteStatus> {
  const [row] = await db
    .select({ status: schema.votes.status })
    .from(schema.votes)
    .where(eq(schema.votes.id, voteId));
  if (!row) throw new Error(`Vote ${voteId} vanished`);
  return row.status as VoteStatus;
}

/**
 * Backdates scheduled_from so `open()` accepts "now", opens through the real
 * handler (electorate snapshot + audit), then backdates opened_at.
 * Tolerates the production scheduler having opened the vote a moment earlier.
 */
async function openBackdated(
  deps: VoteDeps,
  built: BuiltTenant,
  voteId: string,
  openedAt: Date,
): Promise<'OPENED' | 'ALREADY_OPEN'> {
  await deps.db
    .update(schema.votes)
    .set({ scheduledFrom: openedAt })
    .where(eq(schema.votes.id, voteId));

  let result: 'OPENED' | 'ALREADY_OPEN' = 'OPENED';
  try {
    await runAsUser(deps.cls, built.admin, () =>
      deps.commandBus.execute(
        new OpenVoteCommand(built.tenantId, voteId, built.admin.membershipId),
      ),
    );
  } catch (error) {
    if (
      error instanceof VoteNotScheduledException &&
      (await readStatus(deps.db, voteId)) === VoteStatus.OPEN
    ) {
      result = 'ALREADY_OPEN';
    } else {
      throw error;
    }
  }

  await deps.db
    .update(schema.votes)
    .set({ openedAt })
    .where(eq(schema.votes.id, voteId));
  return result;
}

async function loadQuestionOptions(
  db: Db,
  voteId: string,
): Promise<{ questionId: string; optionIdByKey: Record<PlanAnswer, string> }> {
  const [question] = await db
    .select({ id: schema.voteQuestions.id })
    .from(schema.voteQuestions)
    .where(eq(schema.voteQuestions.voteId, voteId));
  if (!question) throw new Error(`Vote ${voteId} has no question`);
  const options = await db
    .select({ id: schema.voteOptions.id, key: schema.voteOptions.optionKey })
    .from(schema.voteOptions)
    .where(eq(schema.voteOptions.questionId, question.id));
  const optionIdByKey = Object.fromEntries(
    options.map((o) => [o.key, o.id]),
  ) as Record<PlanAnswer, string>;
  for (const key of ['YES', 'NO', 'ABSTAIN'] as PlanAnswer[]) {
    if (!optionIdByKey[key])
      throw new Error(`Option ${key} missing on ${voteId}`);
  }
  return { questionId: question.id, optionIdByKey };
}

/** Casts each ballot as its owner and spreads cast_at evenly over [from, to]. */
async function castBallots(
  deps: VoteDeps,
  built: BuiltTenant,
  voteId: string,
  ballots: PlanBallot[],
  from: Date,
  to: Date,
): Promise<void> {
  if (ballots.length === 0) return;
  const { questionId, optionIdByKey } = await loadQuestionOptions(
    deps.db,
    voteId,
  );
  const step = (to.getTime() - from.getTime()) / (ballots.length + 1);

  for (const [i, ballot] of ballots.entries()) {
    const voter = built.voterByKey[ballot.ownerKey];
    if (!voter) throw new Error(`Owner "${ballot.ownerKey}" has no account`);
    const unitId = built.unitIdByNo[ballot.unitNo];

    await runAsUser(deps.cls, voter, () =>
      deps.commandBus.execute(
        new SubmitBallotCommand(built.tenantId, voteId, voter.membershipId, [
          {
            unitId,
            answers: [{ questionId, optionId: optionIdByKey[ballot.answer] }],
          },
        ]),
      ),
    );

    const castAt = new Date(from.getTime() + step * (i + 1));
    await deps.db
      .update(schema.ballots)
      .set({ castAt })
      .where(
        and(
          eq(schema.ballots.voteId, voteId),
          eq(schema.ballots.unitId, unitId),
        ),
      );
  }
}

/**
 * Casts only the plan ballots whose unit doesn't already have one for this
 * vote, so a rerun of phase 2 that was interrupted mid-way can safely finish
 * casting the rest without hitting `BallotAlreadyCastException`.
 */
async function castMissingBallots(
  deps: VoteDeps,
  built: BuiltTenant,
  voteId: string,
  ballots: PlanBallot[],
  from: Date,
  to: Date,
): Promise<void> {
  const existing = await deps.db
    .select({ unitId: schema.ballots.unitId })
    .from(schema.ballots)
    .where(eq(schema.ballots.voteId, voteId));
  const castUnitIds = new Set(existing.map((b) => b.unitId));
  const missing = ballots.filter(
    (ballot) => !castUnitIds.has(built.unitIdByNo[ballot.unitNo]),
  );
  await castBallots(deps, built, voteId, missing, from, to);
}

async function closeBackdated(
  deps: VoteDeps,
  built: BuiltTenant,
  voteId: string,
  closedAt: Date,
): Promise<void> {
  try {
    await runAsUser(deps.cls, built.admin, () =>
      deps.commandBus.execute(
        new CloseVoteCommand(built.tenantId, voteId, built.admin.membershipId),
      ),
    );
  } catch (error) {
    if (
      !(error instanceof VoteNotOpenException) ||
      (await readStatus(deps.db, voteId)) !== VoteStatus.CLOSED
    ) {
      throw error;
    }
  }
  await deps.db
    .update(schema.votes)
    .set({ closedAt, scheduledTo: closedAt })
    .where(eq(schema.votes.id, voteId));
}

/** Phase 1: create every plan vote in its intended state. Returns the vote id. */
export async function seedPlanVote(
  deps: VoteDeps,
  built: BuiltTenant,
  vote: PlanVote,
  now: Date,
): Promise<string> {
  const state = vote.state;

  if (state.kind === 'CLOSED') {
    if (state.openedDaysAgo - state.closedDaysAgo < 15) {
      throw new Error(
        `Vote "${vote.key}": closed per rollam window must be at least 15 days`,
      );
    }
    const openedAt = daysFrom(now, -state.openedDaysAgo);
    const closedAt = daysFrom(now, -state.closedDaysAgo);
    // schedule() needs a future start and a >= 15-day window at scheduling time
    const voteId = await createScheduledVote(
      deps,
      built,
      vote,
      daysFrom(now, 1),
      daysFrom(
        now,
        1 + Math.max(16, state.openedDaysAgo - state.closedDaysAgo),
      ),
    );
    await openBackdated(deps, built, voteId, openedAt);
    await castBallots(deps, built, voteId, vote.ballots, openedAt, closedAt);
    await closeBackdated(deps, built, voteId, closedAt);
    return voteId;
  }

  // SCHEDULED and OPEN_IN_PHASE_2 both stay scheduled after phase 1.
  const from = daysFrom(now, state.opensInDays);
  return createScheduledVote(
    deps,
    built,
    vote,
    from,
    daysFrom(from, state.windowDays),
  );
}

/** Phase 2: open the OPEN_IN_PHASE_2 vote and cast its pre-planned ballots. */
export async function openPhaseTwoVote(
  deps: VoteDeps,
  built: BuiltTenant,
  vote: PlanVote,
  now: Date,
): Promise<'OPENED' | 'ALREADY_OPEN'> {
  if (vote.state.kind !== 'OPEN_IN_PHASE_2') {
    throw new Error(`Vote "${vote.key}" is not a phase-two vote`);
  }
  // The participant must have registered (task O1) before we touch anything:
  // their owner row needs a linked user with a membership in this tenant.
  const participant = built.participant;
  if (!participant?.voter) {
    throw new Error(
      'Participant has not registered yet — finish task O1 first (no changes were made)',
    );
  }
  const votes = await deps.db
    .select({
      id: schema.votes.id,
      title: schema.votes.title,
      status: schema.votes.status,
    })
    .from(schema.votes)
    .where(eq(schema.votes.tenantId, built.tenantId));
  const match = votes.find((v) => v.title === vote.title);
  if (!match)
    throw new Error(`Vote "${vote.title}" not found in ${built.tenantName}`);
  if (
    match.status !== VoteStatus.OPEN &&
    match.status !== VoteStatus.SCHEDULED
  ) {
    throw new Error(
      `Vote "${vote.title}" is ${match.status}, expected SCHEDULED or OPEN`,
    );
  }

  // Already OPEN (this run's own retry, or the production scheduler winning
  // the race) — don't touch scheduled_from/opened_at again; just finish
  // casting whichever plan ballots a prior interrupted run left uncast.
  const openedAt = daysFrom(now, -vote.state.openedDaysAgo);
  const result: 'OPENED' | 'ALREADY_OPEN' =
    match.status === VoteStatus.OPEN
      ? 'ALREADY_OPEN'
      : await openBackdated(deps, built, match.id, openedAt);
  await castMissingBallots(deps, built, match.id, vote.ballots, openedAt, now);

  const [electorateRow] = await deps.db
    .select({
      representativeMembershipId:
        schema.voteElectorateUnits.representativeMembershipId,
    })
    .from(schema.voteElectorateUnits)
    .where(
      and(
        eq(schema.voteElectorateUnits.voteId, match.id),
        eq(schema.voteElectorateUnits.unitId, participant.unitId),
      ),
    )
    .limit(1);
  if (!electorateRow || electorateRow.representativeMembershipId === null) {
    console.warn(
      `⚠️  WARNING: the participant's unit has no representative in the electorate for "${vote.title}" — task O3 will fail until this is fixed.`,
    );
  }

  return result;
}
