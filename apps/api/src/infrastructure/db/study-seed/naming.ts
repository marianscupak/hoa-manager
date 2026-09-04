import * as crypto from 'node:crypto';

export const STUDY_EMAIL_DOMAIN = 'study.hoa';
const PARTICIPANT_ID_PATTERN = /^P\d{1,2}$/;

export function normalizeParticipantId(raw: string): string {
  const id = raw.trim().toUpperCase();
  if (!PARTICIPANT_ID_PATTERN.test(id)) {
    throw new Error(
      `Invalid participant id "${raw}": expected P0–P99 (e.g. --participant P3)`,
    );
  }
  return id;
}

export function participantTag(id: string): string {
  return `[${id}]`;
}

export function tenantName(base: string, id: string): string {
  return `${base} ${participantTag(id)}`;
}

/** "Lenka Marešová" -> "lenka.maresova" (ASCII, dot-separated). */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

export function studyEmail(id: string, slug: string): string {
  return `${id.toLowerCase()}.${slug}@${STUDY_EMAIL_DOMAIN}`;
}

/** True for any fictional/persona account's address; false for a real email. */
export function isStudyEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@' + STUDY_EMAIL_DOMAIN);
}

export function personaEmail(id: string): string {
  return studyEmail(id, 'vybor');
}

/** SQL LIKE pattern matching every seeded account of one participant. */
export function studyEmailLikePattern(id: string): string {
  return `${id.toLowerCase()}.%@${STUDY_EMAIL_DOMAIN}`;
}

// No 0/O, 1/l/I — the password is read aloud and typed by participants.
const PASSWORD_ALPHABET =
  'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generatePassword(
  random: (max: number) => number = (max) => crypto.randomInt(max),
): string {
  const chunk = () =>
    Array.from(
      { length: 4 },
      () => PASSWORD_ALPHABET[random(PASSWORD_ALPHABET.length)],
    ).join('');
  return `Svj-${chunk()}-${chunk()}`;
}
