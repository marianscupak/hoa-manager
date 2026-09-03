import { parseArgs } from 'node:util';

import { normalizeEmail } from '@/shared/application/utils/normalize-email';

import { normalizeParticipantId } from './naming';

export type StudySeedArgs =
  | {
      mode: 'seed';
      participantId: string;
      email: string;
      name: string;
      force: boolean;
    }
  | { mode: 'open'; participantId: string }
  | { mode: 'cleanup'; participantId: string; email: string | null }
  | { mode: 'help' };

export const USAGE = `Usage:
  study-seed --participant <Pn> --email <participant email> [--name "<name>"] [--force]
      Phase 1 (before the session): creates the persona, tenant B and tenant C.
  study-seed --open <Pn>
      Phase 2 (right after task O1): opens "Oprava výtahu" in tenant C.
  study-seed --cleanup <Pn> [--email <participant email>]
      Removes everything seeded for the participant (and the participant's own
      account when --email is given and it has no other memberships).
  study-seed --help`;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmail(raw: string): string {
  const email = normalizeEmail(raw);
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error(`"${raw}" is not a valid email address`);
  }
  return email;
}

export function parseStudySeedArgs(argv: string[]): StudySeedArgs {
  const args = argv[0] === '--' ? argv.slice(1) : argv;
  const { values } = parseArgs({
    args,
    strict: true,
    options: {
      participant: { type: 'string' },
      open: { type: 'string' },
      cleanup: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) return { mode: 'help' };

  const modes = [values.participant, values.open, values.cleanup].filter(
    (v) => v !== undefined,
  );
  if (modes.length !== 1) {
    throw new Error(
      `Pass exactly one of --participant, --open or --cleanup.\n\n${USAGE}`,
    );
  }

  if (values.cleanup !== undefined) {
    return {
      mode: 'cleanup',
      participantId: normalizeParticipantId(values.cleanup),
      email: values.email ? parseEmail(values.email) : null,
    };
  }

  if (values.open !== undefined) {
    return { mode: 'open', participantId: normalizeParticipantId(values.open) };
  }

  const participantId = normalizeParticipantId(values.participant as string);
  if (!values.email) {
    throw new Error('--email is required when seeding a participant');
  }
  return {
    mode: 'seed',
    participantId,
    email: parseEmail(values.email),
    name: values.name?.trim() || `Účastník ${participantId}`,
    force: values.force ?? false,
  };
}
