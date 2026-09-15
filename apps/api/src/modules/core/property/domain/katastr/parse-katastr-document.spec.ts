import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseKatastrDocument } from '@/modules/core/property/domain/katastr/parse-katastr-document';
import { Rational } from '@/shared/domain/rational';

const FIXTURE = readFileSync(
  join(__dirname, '__fixtures__/dum-vsechny-jednotky.xml'),
  'utf8',
);

const parseFixture = () => {
  const result = parseKatastrDocument(FIXTURE);
  if (!result.ok) {
    throw new Error(`expected a parse, got ${JSON.stringify(result.errors)}`);
  }
  return result;
};

describe('parseKatastrDocument — sample house', () => {
  it('reads 38 units, not the 76 jednotka elements in the file', () => {
    // The whole unit subtree is emitted twice: once under
    // nemovitosti/parcely/parcela/stavba and once under nemovitosti/stavby/stavba.
    expect((FIXTURE.match(/<ct:jednotka>/g) ?? []).length).toBe(76);
    expect(parseFixture().document.units).toHaveLength(38);
  });

  it('reads the document header', () => {
    const { document } = parseFixture();
    expect(document.validAt.toISOString()).toBe('2024-04-08T00:15:02.000Z');
    expect(document.issuedAt.toISOString()).toBe('2026-09-15T14:51:26.000Z');
    expect(document.lvNumber).toBe('33');
    expect(document.municipality).toBe('Volary');
    expect(document.cadastralArea).toBe('Volary');
    expect(document.buildings).toEqual([
      { katastrId: '311151306', houseNumbers: ['132', '133'] },
    ]);
  });

  it('builds unit numbers from house number and unit number', () => {
    const numbers = parseFixture().document.units.map((u) => u.unitNo);
    expect(new Set(numbers).size).toBe(38);
    expect(numbers).toContain('132/1');
    expect(numbers).toContain('133/20');
    // ct:cislo alone has only 20 distinct values and would collide.
    expect(numbers).not.toContain('1');
  });

  it('keeps building shares as the cadastre wrote them and they sum to 1/1', () => {
    const { units } = parseFixture().document;
    const first = units.find((u) => u.unitNo === '132/1');
    // Measured from the fixture directly: unit 132/1 is katastr id 18868306,
    // whose ct:podil is 6342/206422 (132/2, id 18869306, is the 3819 one).
    expect(first?.buildingShare).toEqual({ num: 6342n, den: 206422n });
    expect(units.every((u) => u.buildingShare.den === 206422n)).toBe(true);

    const total = Rational.sum(
      units.map((u) => Rational.from(u.buildingShare.num, u.buildingShare.den)),
    );
    expect(total.eq(Rational.one())).toBe(true);
  });

  it('reads 43 ownership parties whose shares sum to 1/1 per unit', () => {
    const { units } = parseFixture().document;
    expect(units.flatMap((u) => u.parties)).toHaveLength(43);
    expect(units.filter((u) => u.parties.length > 1)).toHaveLength(3);

    for (const unit of units) {
      const total = Rational.sum(
        unit.parties.map((p) => Rational.from(p.share.num, p.share.den)),
      );
      expect(total.eq(Rational.one())).toBe(true);
    }
  });

  it('distinguishes the three subject types', () => {
    const parties = parseFixture().document.units.flatMap((u) => u.parties);
    const byType = (t: string) => parties.filter((p) => p.type === t);
    expect(byType('OFO')).toHaveLength(30);
    expect(byType('BSM')).toHaveLength(10);
    expect(byType('OPO')).toHaveLength(3);
    expect(new Set(parties.map((p) => p.katastrSubjectId)).size).toBe(39);
  });

  it('gives SJM two members and names them given-name-first', () => {
    const bsm = parseFixture()
      .document.units.flatMap((u) => u.parties)
      .filter((p) => p.type === 'BSM');
    expect(bsm.every((p) => p.members.length === 2)).toBe(true);
    // The cadastre writes nazevSJ as "Král Evžen a Těžká Marie"; owners.display_name
    // is given-name-first everywhere in the app, so the parser flips it.
    const names = bsm.flatMap((p) => p.members.map((m) => m.displayName));
    expect(names).toContain('Evžen Král');
    expect(names).toContain('Marie Těžká');
    expect(names).not.toContain('Král Evžen');
  });

  it('reads 49 distinct people and IČO only for legal entities', () => {
    const members = parseFixture()
      .document.units.flatMap((u) => u.parties)
      .flatMap((p) => p.members);
    expect(new Set(members.map((m) => m.katastrPersonId)).size).toBe(49);

    const withIco = members.filter((m) => m.ico !== null);
    expect(withIco.map((m) => `${m.displayName}|${m.ico}`).sort()).toEqual([
      'B 2000  REAL a.s.|79376253',
      'Město Volary|250830',
      'Město Volary|250830',
    ]);
  });

  it('reads the usage code and name', () => {
    const { units } = parseFixture().document;
    const codes = units.map((u) => u.usageCode);
    expect(codes.filter((c) => c === '1')).toHaveLength(36);
    expect(codes.filter((c) => c === '5')).toHaveLength(2);
    expect(units.find((u) => u.usageCode === '5')?.usageName).toBe(
      'jiný nebytový prostor',
    );
  });

  it('emits no warnings for a clean file', () => {
    expect(parseFixture().warnings).toEqual([]);
  });

  it('never carries a birth number into the output', () => {
    // The element exists in the file; its value must not reach any output type.
    expect(FIXTURE).toContain('rodneCislo');
    const serialised = JSON.stringify(parseFixture().document, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    );
    expect(serialised).not.toMatch(/rodneCislo|rodne_cislo/i);
  });

  it('never carries a birth number into a malformed-XML error either', () => {
    // fast-xml-parser's thrown message embeds ~50 raw characters of the
    // source around the failure position. A truncated upload with a
    // populated rodneCislo nearby must not leak it through MALFORMED_XML.
    const BIRTH_NUMBER = '7001011234';
    const truncated = `<root><ct:oS><ct:rodneCislo>${BIRTH_NUMBER}</ct:rodneCislo><ct:jm`;
    const result = parseKatastrDocument(truncated);
    expect(result).toEqual({ ok: false, errors: [{ code: 'MALFORMED_XML' }] });
    expect(JSON.stringify(result)).not.toContain(BIRTH_NUMBER);
  });

  it('rejects a subject with an unrecognised typ', () => {
    const doc = `<?xml version="1.0" encoding="UTF-8"?>
<vypisZKatastruNemovitosti>
  <obecneUdaje>
    <ct:platnost>2024-04-08T00:15:02</ct:platnost>
    <ct:vyhotoveno>2026-09-15T14:51:26</ct:vyhotoveno>
    <castecnyVypis>n</castecnyVypis>
  </obecneUdaje>
  <listyVlastnictvi>
    <listVlastnictvi>
      <id>1</id>
      <cislo>33</cislo>
      <obec><ct:nazev>Volary</ct:nazev></obec>
      <katastrUzemi><ct:nazev>Volary</ct:nazev></katastrUzemi>
      <nemovitosti>
        <stavby>
          <ct:stavba>
            <ct:id>1</ct:id>
            <ct:cislaDomovni>132</ct:cislaDomovni>
            <ct:jednotky>
              <ct:jednotka>
                <ct:id>1</ct:id>
                <ct:cisloDomovni>132</ct:cisloDomovni>
                <ct:cislo>1</ct:cislo>
                <ct:podil><ct:citatel>1</ct:citatel><ct:jmenovatel>1</ct:jmenovatel></ct:podil>
                <ct:zpusobVyuziti><ct:kod>1</ct:kod><ct:nazev>byt</ct:nazev></ct:zpusobVyuziti>
                <ct:seznamVlastnictvi>
                  <ct:vlastnictvi>
                    <ct:id>1</ct:id>
                    <ct:podil><ct:citatel>1</ct:citatel><ct:jmenovatel>1</ct:jmenovatel></ct:podil>
                    <ct:opravnenySubjekt>
                      <ct:id>1</ct:id>
                      <ct:typ>STAT</ct:typ>
                      <ct:oS>
                        <ct:id>1</ct:id>
                        <ct:typ>OFO</ct:typ>
                        <ct:jmeno>Jan</ct:jmeno>
                        <ct:prijmeni>Novak</ct:prijmeni>
                      </ct:oS>
                    </ct:opravnenySubjekt>
                  </ct:vlastnictvi>
                </ct:seznamVlastnictvi>
              </ct:jednotka>
            </ct:jednotky>
          </ct:stavba>
        </stavby>
      </nemovitosti>
    </listVlastnictvi>
  </listyVlastnictvi>
</vypisZKatastruNemovitosti>`;

    const result = parseKatastrDocument(doc);
    // No `typ` on the payload: "STAT" is unbounded document text, and the
    // same "remove rather than filter" rule that dropped SHARE_MALFORMED's
    // `value` applies here too. `unitNo` alone locates the row.
    expect(result).toEqual({
      ok: false,
      errors: [{ code: 'UNKNOWN_SUBJECT_TYPE', unitNo: '132/1' }],
    });
  });
});
