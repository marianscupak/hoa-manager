type Lang = 'cs' | 'en';

export const STRINGS: Record<
  Lang,
  Record<string, (vars: Record<string, string>) => string>
> = {
  en: {
    'tenant.created.public': (v) => `${v.actor} created the community.`,
    'membership.created.privileged': (v) =>
      `${v.actor} added ${v.member} as ${v.role}.`,
    'membership.role.updated.privileged': (v) =>
      `${v.actor} changed ${v.member}'s role from ${v.previousRole} to ${v.newRole}.`,
    'membership.status.updated.privileged': (v) =>
      `${v.actor} changed ${v.member}'s status from ${v.previousStatus} to ${v.newStatus}.`,
    'unit.created.privileged': (v) => `${v.actor} added unit ${v.unit}.`,
    'unit.updated.privileged': (v) => `${v.actor} updated unit ${v.unit}.`,
    'unit.deleted.privileged': (v) => `${v.actor} removed unit ${v.unit}.`,
    'owner.created.privileged': (v) =>
      `${v.actor} added owner record ${v.owner}.`,
    'owner.deleted.privileged': (v) =>
      `${v.actor} removed owner record ${v.owner}.`,
    'unit.ownership.replaced.privileged': (v) =>
      `${v.actor} changed ownership of unit ${v.unit} (now: ${v.owners}).`,
    'unit.ownership.replaced.effective.privileged': (v) =>
      `${v.actor} changed ownership of unit ${v.unit} effective ${v.effectiveFrom} (now: ${v.owners}).`,
    'unit.ownership.transferCancelled.privileged': (v) =>
      `${v.actor} cancelled the ownership change of unit ${v.unit} scheduled for ${v.effectiveFrom}.`,
    'owner.email.added.privileged': (v) =>
      `${v.actor} added an email address for owner ${v.owner}.`,
    'owner.user.linked.privileged': (v) =>
      `${v.actor} linked owner ${v.owner} to user ${v.user}.`,
    'owner.user.unlinked.privileged': (v) =>
      `${v.actor} removed the link between owner ${v.owner} and user ${v.user}.`,
    'invite.sent.privileged': (v) =>
      `${v.actor} sent an invitation to ${v.email} for owner ${v.owner}.`,
    'invite.revoked.privileged': (v) =>
      `${v.actor} revoked the invitation for owner ${v.owner}.`,
    'invite.accepted.public': (v) => `${v.user} joined the community.`,
    'katastr.imported.privileged': (v) =>
      `${v.actor} imported register data from the real estate register: ${v.created} units added, ${v.updated} updated, effective ${v.effectiveFrom}.`,
    unknown: (v) => `Activity recorded (${v.eventType}).`,
  },
  cs: {
    'tenant.created.public': (v) => `${v.actor} vytvořil/a komunitu.`,
    'membership.created.privileged': (v) =>
      `${v.actor} přidal/a člena ${v.member} jako ${v.role}.`,
    'membership.role.updated.privileged': (v) =>
      `${v.actor} změnil/a roli člena ${v.member} z ${v.previousRole} na ${v.newRole}.`,
    'membership.status.updated.privileged': (v) =>
      `${v.actor} změnil/a stav členství ${v.member} z ${v.previousStatus} na ${v.newStatus}.`,
    'unit.created.privileged': (v) => `${v.actor} přidal/a jednotku ${v.unit}.`,
    'unit.updated.privileged': (v) =>
      `${v.actor} upravil/a jednotku ${v.unit}.`,
    'unit.deleted.privileged': (v) =>
      `${v.actor} odstranil/a jednotku ${v.unit}.`,
    'owner.created.privileged': (v) =>
      `${v.actor} přidal/a vlastníka ${v.owner}.`,
    'owner.deleted.privileged': (v) =>
      `${v.actor} odstranil/a vlastníka ${v.owner}.`,
    'unit.ownership.replaced.privileged': (v) =>
      `${v.actor} změnil/a vlastnictví jednotky ${v.unit} (nyní: ${v.owners}).`,
    'unit.ownership.replaced.effective.privileged': (v) =>
      `${v.actor} změnil/a vlastnictví jednotky ${v.unit} s účinností od ${v.effectiveFrom} (nyní: ${v.owners}).`,
    'unit.ownership.transferCancelled.privileged': (v) =>
      `${v.actor} zrušil/a naplánovanou změnu vlastnictví jednotky ${v.unit} k ${v.effectiveFrom}.`,
    'owner.email.added.privileged': (v) =>
      `${v.actor} přidal/a e-mail vlastníkovi ${v.owner}.`,
    'owner.user.linked.privileged': (v) =>
      `${v.actor} propojil/a vlastníka ${v.owner} s uživatelem ${v.user}.`,
    'owner.user.unlinked.privileged': (v) =>
      `${v.actor} zrušil/a propojení vlastníka ${v.owner} s uživatelem ${v.user}.`,
    'invite.sent.privileged': (v) =>
      `${v.actor} odeslal/a pozvánku na ${v.email} pro vlastníka ${v.owner}.`,
    'invite.revoked.privileged': (v) =>
      `${v.actor} zrušil/a pozvánku pro vlastníka ${v.owner}.`,
    'invite.accepted.public': (v) => `${v.user} se přidal/a do komunity.`,
    'katastr.imported.privileged': (v) =>
      `${v.actor} naimportoval/a údaje z katastru nemovitostí: ${v.created} jednotek přidáno, ${v.updated} upraveno, s účinností od ${v.effectiveFrom}.`,
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
