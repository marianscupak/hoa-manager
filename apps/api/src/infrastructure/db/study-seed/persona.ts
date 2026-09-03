import { eq } from 'drizzle-orm';

import * as schema from '@/infrastructure/db/schema';

import { personaEmail } from './naming';
import { type DbLike } from './structure';

export const PERSONA_NAME = 'Karel Malý';

export async function findPersonaUser(
  db: DbLike,
  participantId: string,
): Promise<{ id: string } | null> {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, personaEmail(participantId)))
    .limit(1);
  return user ?? null;
}

export async function createPersonaUser(
  db: DbLike,
  participantId: string,
  passwordHash: string,
): Promise<{ id: string }> {
  const email = personaEmail(participantId);
  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      fullName: PERSONA_NAME,
      isEmailVerified: true,
      isActive: true,
    })
    .returning({ id: schema.users.id });
  await db.insert(schema.authIdentities).values({
    userId: user.id,
    provider: 'LOCAL',
    providerSubject: email,
    passwordHash,
  });
  return user;
}
