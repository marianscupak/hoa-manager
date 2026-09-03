import * as crypto from 'node:crypto';

import { NestFactory } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { SchedulerRegistry } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { ClsService } from 'nestjs-cls';

import { AppModule } from '@/app.module';
import { DrizzleService } from '@/infrastructure/db/drizzle.service';

import { JASMINOVA_3, PHASE_TWO_VOTE_KEY, SLUNECNA_12 } from './buildings';
import { cleanupParticipant } from './cleanup';
import { parseStudySeedArgs, type StudySeedArgs, USAGE } from './cli';
import { generatePassword, personaEmail } from './naming';
import { createPersonaUser, findPersonaUser, PERSONA_NAME } from './persona';
import {
  buildTenant,
  type BuiltTenant,
  type Db,
  loadBuiltTenant,
  type StudyContext,
} from './structure';
import { openPhaseTwoVote, seedPlanVote, type VoteDeps } from './votes';

type Seed = Extract<StudySeedArgs, { mode: 'seed' }>;

function printCard(
  args: Seed,
  password: string,
  tenantB: BuiltTenant,
  tenantC: BuiltTenant,
): void {
  const participantUnit = JASMINOVA_3.parties.find((p) =>
    p.ownerKeys.includes('participant'),
  )!;
  const share = JASMINOVA_3.units.find(
    (u) => u.unitNo === participantUnit.unitNo,
  )!;
  console.log(`
════════ Karta účastníka ${args.participantId} ════════
Persona (výbor):      ${PERSONA_NAME}
Přihlášení:           ${personaEmail(args.participantId)}
Heslo:                ${password}
Společenství B:       ${tenantB.tenantName}
Společenství C:       ${tenantC.tenantName}
Účastník (vlastník):  ${args.name} <${args.email}> — jednotka ${participantUnit.unitNo}, podíl ${share.shareNumerator}/10000
Po úkolu O1 spusť:    scripts/study-seed.sh open ${args.participantId}
Po sezení spusť:      scripts/study-seed.sh cleanup ${args.participantId} ${args.email}
══════════════════════════════════════════════════
`);
}

async function runSeed(args: Seed, db: Db, deps: VoteDeps): Promise<void> {
  const existing = await findPersonaUser(db, args.participantId);
  if (existing) {
    if (!args.force) {
      throw new Error(
        `Participant ${args.participantId} is already seeded. Re-run with --force to wipe and re-seed, or --cleanup to remove.`,
      );
    }
    const summary = await cleanupParticipant(
      db,
      args.participantId,
      args.email,
    );
    console.log('♻️  --force: removed previous data', summary);
  }

  const password = generatePassword();
  const [personaHash, fictionalPasswordHash] = await Promise.all([
    bcrypt.hash(password, 10),
    bcrypt.hash(crypto.randomUUID(), 10),
  ]);
  const persona = await createPersonaUser(db, args.participantId, personaHash);
  console.log(`✅ Persona ${personaEmail(args.participantId)} created`);

  const ctx: StudyContext = {
    participantId: args.participantId,
    personaUserId: persona.id,
    participant: { email: args.email, name: args.name },
    fictionalPasswordHash,
  };
  const now = new Date();

  const tenantB = await buildTenant(db, SLUNECNA_12, ctx);
  console.log(`✅ ${tenantB.tenantName}: structure created`);
  for (const vote of SLUNECNA_12.votes) {
    await seedPlanVote(deps, tenantB, vote, now);
    console.log(`   ↳ vote "${vote.title}" → ${vote.state.kind}`);
  }

  const tenantC = await buildTenant(db, JASMINOVA_3, ctx);
  console.log(`✅ ${tenantC.tenantName}: structure created`);
  for (const vote of JASMINOVA_3.votes) {
    await seedPlanVote(deps, tenantC, vote, now);
    console.log(
      `   ↳ vote "${vote.title}" → ${vote.state.kind === 'CLOSED' ? 'CLOSED' : 'SCHEDULED'}`,
    );
  }

  printCard(args, password, tenantB, tenantC);
}

async function runOpen(
  participantId: string,
  db: Db,
  deps: VoteDeps,
): Promise<void> {
  const tenantC = await loadBuiltTenant(db, JASMINOVA_3, participantId);
  if (!tenantC)
    throw new Error(
      `Tenant C for ${participantId} not found — run phase 1 first`,
    );
  const vote = JASMINOVA_3.votes.find((v) => v.key === PHASE_TWO_VOTE_KEY)!;
  const result = await openPhaseTwoVote(deps, tenantC, vote, new Date());
  console.log(
    `✅ "${vote.title}" in ${tenantC.tenantName}: ${result === 'OPENED' ? 'OPEN (opened now)' : 'OPEN (was already open)'}`,
  );
}

async function main(): Promise<void> {
  const args = parseStudySeedArgs(process.argv.slice(2));
  if (args.mode === 'help') {
    console.log(USAGE);
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    // The seed drives the vote lifecycle itself; keep this process's cron quiet.
    const registry = app.get(SchedulerRegistry);
    for (const [, job] of registry.getCronJobs()) job.stop();

    const db = app.get(DrizzleService).db;
    const deps: VoteDeps = {
      db,
      commandBus: app.get(CommandBus),
      cls: app.get(ClsService),
    };

    switch (args.mode) {
      case 'seed':
        await runSeed(args, db, deps);
        break;
      case 'open':
        await runOpen(args.participantId, db, deps);
        break;
      case 'cleanup': {
        const summary = await cleanupParticipant(
          db,
          args.participantId,
          args.email,
        );
        console.log(`🧹 Cleanup ${args.participantId}:`, summary);
        break;
      }
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
