interface UnitSpec {
  id?: string;
  houseNo?: string;
  number?: string;
  /** null omits the <ct:podil> element entirely. */
  share?: { num: string; den: string } | null;
  parties?: PartySpec[];
  /** true emits no <ct:vlastnictvi> rows at all. */
  noOwners?: boolean;
}

interface PartySpec {
  /** null omits <ct:id> from ct:opravnenySubjekt entirely. */
  subjectId?: string | null;
  type?: 'OFO' | 'OPO' | 'BSM';
  /**
   * Suppresses only the <ct:typ> line under ct:opravnenySubjekt — `type`
   * still drives the rest of the party's shape (BSM's second spouse, the
   * embedded oS/oS2 person type), so this is not the same as making `type`
   * itself nullable.
   */
  omitType?: boolean;
  share?: { num: string; den: string } | null;
  /** Omit the second spouse to break BSM shape. */
  secondSpouse?: boolean;
}

const person = (id: string, tag: 'oS' | 'oS2', type: string) => `
  <ct:${tag}>
    <ct:id>${id}</ct:id>
    <ct:typ>${type}</ct:typ>
    <ct:jmeno>Jan</ct:jmeno>
    <ct:prijmeni>Novák</ct:prijmeni>
    <ct:rodneCislo></ct:rodneCislo>
  </ct:${tag}>`;

const partyXml = (p: PartySpec, i: number) => {
  const type = p.type ?? 'OFO';
  const share =
    p.share === null
      ? '<ct:podil/>'
      : `<ct:podil><ct:citatel>${p.share?.num ?? '1'}</ct:citatel>` +
        `<ct:jmenovatel>${p.share?.den ?? '1'}</ct:jmenovatel></ct:podil>`;
  const second =
    type === 'BSM' && p.secondSpouse !== false
      ? person(`p${i}b`, 'oS2', 'OFO')
      : '';
  const subjectId =
    p.subjectId === null ? '' : `<ct:id>${p.subjectId ?? `s${i}`}</ct:id>`;
  const typXml = p.omitType === true ? '' : `<ct:typ>${type}</ct:typ>`;
  return `
    <ct:vlastnictvi>
      <ct:id>v${i}</ct:id>
      ${share}
      <ct:opravnenySubjekt>
        ${subjectId}
        ${typXml}
        <ct:charKod>2</ct:charKod>
        ${person(`p${i}a`, 'oS', type === 'BSM' ? 'OFO' : type)}
        ${second}
      </ct:opravnenySubjekt>
    </ct:vlastnictvi>`;
};

const unitXml = (u: UnitSpec, i: number) => {
  const share =
    u.share === null
      ? '<ct:podil/>'
      : `<ct:podil><ct:citatel>${u.share?.num ?? '1'}</ct:citatel>` +
        `<ct:jmenovatel>${u.share?.den ?? '1'}</ct:jmenovatel></ct:podil>`;
  const parties = u.noOwners ? '' : (u.parties ?? [{}]).map(partyXml).join('');
  return `
    <ct:jednotka>
      <ct:id>${u.id ?? `u${i}`}</ct:id>
      <ct:cislo>${u.number ?? String(i + 1)}</ct:cislo>
      <ct:cisloDomovni>${u.houseNo ?? '132'}</ct:cisloDomovni>
      <ct:cisloJednotky>1320000</ct:cisloJednotky>
      ${share}
      <ct:zpusobVyuziti><ct:kod>1</ct:kod><ct:nazev>byt</ct:nazev></ct:zpusobVyuziti>
      <ct:seznamVlastnictvi>${parties}</ct:seznamVlastnictvi>
    </ct:jednotka>`;
};

export function buildKatastrXml(
  opts: {
    root?: string;
    partial?: boolean;
    doctype?: boolean;
    units?: UnitSpec[];
  } = {},
): string {
  const root = opts.root ?? 'vypisZKatastruNemovitosti';
  const units = (opts.units ?? [{ share: { num: '1', den: '1' } }])
    .map(unitXml)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
${opts.doctype ? '<!DOCTYPE vypisZKatastruNemovitosti [<!ENTITY a "b">]>' : ''}
<${root} xmlns="urn:cz:gov:cuzk:iskn:sestavy:VypisZKatastruNemovitosti:3.0"
         xmlns:ct="urn:cz:gov:cuzk:iskn:sestavy:types:common:3.0">
  <obecneUdaje>
    <ct:platnost>2026-09-01T00:00:00</ct:platnost>
    <ct:vyhotoveno>2026-09-15T10:00:00</ct:vyhotoveno>
    <castecnyVypis>${opts.partial ? 'a' : 'n'}</castecnyVypis>
  </obecneUdaje>
  <listyVlastnictvi>
    <listVlastnictvi>
      <id>1</id>
      <cislo>33</cislo>
      <obec><ct:kod>1</ct:kod><ct:nazev>Volary</ct:nazev></obec>
      <katastrUzemi><ct:kod>1</ct:kod><ct:nazev>Volary</ct:nazev></katastrUzemi>
      <nemovitosti>
        <stavby>
          <stavba>
            <id>311151306</id>
            <cislaDomovni>132</cislaDomovni>
            <jednotky>${units}</jednotky>
          </stavba>
        </stavby>
      </nemovitosti>
    </listVlastnictvi>
  </listyVlastnictvi>
</${root}>`;
}
