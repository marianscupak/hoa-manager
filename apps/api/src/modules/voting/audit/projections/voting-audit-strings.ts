type Lang = 'cs' | 'en';

const STRINGS: Record<
  Lang,
  Record<string, (vars: Record<string, string>) => string>
> = {
  en: {
    'vote.created.privileged': (v) => `${v.actor} created vote "${v.title}".`,
    'vote.rulesetSet.privileged': (v) =>
      `${v.actor} updated the ruleset for "${v.title}".`,
    'vote.rulesetNonStatutoryAcknowledged.privileged': (v) =>
      `Admin acknowledged a non-statutory voting rule deviation (${v.deviations}) — ${v.voteTitle}`,
    'vote.scheduled.public': (v) => `Vote "${v.title}" was scheduled.`,
    'vote.opened.public': (v) => `Vote "${v.title}" was opened.`,
    'vote.electorateSnapshotted.privileged': (v) =>
      `Electorate snapshot for "${v.title}" recorded (${v.totalUnits} units).`,
    'vote.updated.privileged': (v) => `${v.actor} updated vote "${v.title}".`,
    'vote.deleted.privileged': (v) => `${v.actor} deleted vote "${v.title}".`,
    'vote.question.created.privileged': (v) =>
      `${v.actor} added question "${v.question}" to "${v.title}".`,
    'vote.question.updated.privileged': (v) =>
      `${v.actor} edited question "${v.question}" on "${v.title}".`,
    'vote.question.deleted.privileged': (v) =>
      `${v.actor} removed question "${v.question}" from "${v.title}".`,
    'vote.consent.created.privileged': (v) =>
      `${v.owner} named ${v.delegate} to represent unit ${v.unit}.`,
    'vote.consent.revoked.privileged': (v) =>
      `${v.actor} revoked the representation for unit ${v.unit}.`,
    'vote.consent.created.self': (v) =>
      `${v.owner} named ${v.delegate} to represent unit ${v.unit}.`,
    'vote.consent.created.byRecorder': (v) =>
      `${v.recorder} recorded that ${v.delegate} represents ${v.owner} for unit ${v.unit}.`,
    'vote.consent.revoked.self': (v) =>
      `${v.owner} revoked ${v.delegate} representing unit ${v.unit}.`,
    'vote.consent.revoked.byRecorder': (v) =>
      `${v.recorder} revoked ${v.delegate} representing ${v.owner} for unit ${v.unit}.`,
    'ballot.cast.privileged': (v) =>
      `${v.actor} cast ballot for unit ${v.unit}.`,
    'ballot.cast.proxy.privileged': (v) =>
      `${v.actor} recorded a paper ballot for unit ${v.unit}, signed by ${v.signer}.`,
    'ballot.cast.self': () => `Your ballot was recorded.`,
    'vote.closed.public': (v) => `Vote "${v.title}" was closed.`,
    'vote.resultsComputed.public': (v) => `Results computed for "${v.title}".`,
    'vote.document.added.privileged': (v) =>
      `${v.actor} attached document "${v.fileName}" to "${v.title}".`,
    'vote.document.removed.privileged': (v) =>
      `${v.actor} removed document "${v.fileName}" from "${v.title}".`,
    unknown: (v) => `Activity recorded (${v.eventType}).`,
  },
  cs: {
    'vote.created.privileged': (v) =>
      `${v.actor} vytvořil/a hlasování "${v.title}".`,
    'vote.rulesetSet.privileged': (v) =>
      `${v.actor} upravil/a pravidla pro "${v.title}".`,
    'vote.rulesetNonStatutoryAcknowledged.privileged': (v) =>
      `Správce potvrdil odchylku od zákonných pravidel hlasování (${v.deviations}) — ${v.voteTitle}`,
    'vote.scheduled.public': (v) => `Hlasování "${v.title}" bylo naplánováno.`,
    'vote.opened.public': (v) => `Hlasování "${v.title}" bylo zahájeno.`,
    'vote.electorateSnapshotted.privileged': (v) =>
      `Snímek elektorátu pro "${v.title}" zaznamenán (${v.totalUnits} jednotek).`,
    'vote.updated.privileged': (v) =>
      `${v.actor} upravil/a hlasování "${v.title}".`,
    'vote.deleted.privileged': (v) =>
      `${v.actor} odstranil/a hlasování "${v.title}".`,
    'vote.question.created.privileged': (v) =>
      `${v.actor} přidal/a otázku "${v.question}" do "${v.title}".`,
    'vote.question.updated.privileged': (v) =>
      `${v.actor} upravil/a otázku "${v.question}" v "${v.title}".`,
    'vote.question.deleted.privileged': (v) =>
      `${v.actor} odstranil/a otázku "${v.question}" z "${v.title}".`,
    'vote.consent.created.privileged': (v) =>
      `${v.owner} určil/a pro jednotku ${v.unit} zástupce ${v.delegate}.`,
    'vote.consent.revoked.privileged': (v) =>
      `${v.actor} zrušil/a zastoupení pro jednotku ${v.unit}.`,
    'vote.consent.created.self': (v) =>
      `${v.owner} určil/a pro jednotku ${v.unit} zástupce ${v.delegate}.`,
    'vote.consent.created.byRecorder': (v) =>
      `${v.recorder} zaznamenal/a zastoupení jednotky ${v.unit}: vlastníka ${v.owner} zastupuje ${v.delegate}.`,
    'vote.consent.revoked.self': (v) =>
      `${v.owner} zrušil/a zastoupení jednotky ${v.unit} zástupcem ${v.delegate}.`,
    'vote.consent.revoked.byRecorder': (v) =>
      `${v.recorder} zrušil/a zastoupení jednotky ${v.unit}: vlastníka ${v.owner} zastupoval/a ${v.delegate}.`,
    'ballot.cast.privileged': (v) =>
      `${v.actor} hlasoval/a za jednotku ${v.unit}.`,
    'ballot.cast.proxy.privileged': (v) =>
      `${v.actor} zaznamenal(a) listinný hlas za jednotku ${v.unit}, podepsaný: ${v.signer}.`,
    'ballot.cast.self': () => `Váš hlas byl zaznamenán.`,
    'vote.closed.public': (v) => `Hlasování "${v.title}" bylo ukončeno.`,
    'vote.resultsComputed.public': (v) =>
      `Výsledky hlasování "${v.title}" byly spočítány.`,
    'vote.document.added.privileged': (v) =>
      `${v.actor} přiložil(a) dokument „${v.fileName}“ k hlasování „${v.title}“.`,
    'vote.document.removed.privileged': (v) =>
      `${v.actor} odebral(a) dokument „${v.fileName}“ z hlasování „${v.title}“.`,
    unknown: (v) => `Aktivita zaznamenána (${v.eventType}).`,
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
