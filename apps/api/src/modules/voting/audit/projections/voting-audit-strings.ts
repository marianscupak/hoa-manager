type Lang = 'cs' | 'en';

const STRINGS: Record<Lang, Record<string, (vars: Record<string, string>) => string>> = {
  en: {
    'vote.created.privileged': (v) => `${v.actor} created vote "${v.title}".`,
    'vote.rulesetSet.privileged': (v) => `${v.actor} updated the ruleset for "${v.title}".`,
    'vote.scheduled.public': (v) => `Vote "${v.title}" was scheduled.`,
    'vote.opened.public': (v) => `Vote "${v.title}" was opened.`,
    'vote.electorateSnapshotted.privileged': (v) =>
      `Electorate snapshot for "${v.title}" recorded (${v.totalUnits} units).`,
    'ballot.cast.privileged': (v) => `${v.actor} cast ballot for unit ${v.unit}.`,
    'ballot.cast.self': () => `Your ballot was recorded.`,
    'vote.closed.public': (v) => `Vote "${v.title}" was closed.`,
    'vote.resultsComputed.public': (v) => `Results computed for "${v.title}".`,
    'unknown': (v) => `Activity recorded (${v.eventType}).`,
  },
  cs: {
    'vote.created.privileged': (v) => `${v.actor} vytvořil/a hlasování "${v.title}".`,
    'vote.rulesetSet.privileged': (v) => `${v.actor} upravil/a pravidla pro "${v.title}".`,
    'vote.scheduled.public': (v) => `Hlasování "${v.title}" bylo naplánováno.`,
    'vote.opened.public': (v) => `Hlasování "${v.title}" bylo zahájeno.`,
    'vote.electorateSnapshotted.privileged': (v) =>
      `Snímek elektorátu pro "${v.title}" zaznamenán (${v.totalUnits} jednotek).`,
    'ballot.cast.privileged': (v) => `${v.actor} hlasoval/a za jednotku ${v.unit}.`,
    'ballot.cast.self': () => `Váš hlas byl zaznamenán.`,
    'vote.closed.public': (v) => `Hlasování "${v.title}" bylo ukončeno.`,
    'vote.resultsComputed.public': (v) => `Výsledky hlasování "${v.title}" byly spočítány.`,
    'unknown': (v) => `Aktivita zaznamenána (${v.eventType}).`,
  },
};

export function t(
  lang: string | undefined,
  key: string,
  vars: Record<string, string> = {},
): string {
  const l = (lang === 'cs' ? 'cs' : 'en') as Lang;
  const fn = STRINGS[l][key] ?? STRINGS.en[key] ?? STRINGS.en.unknown;
  return fn(vars);
}
