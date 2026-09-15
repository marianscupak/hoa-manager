import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildKatastrXml } from '@/modules/core/property/domain/katastr/__fixtures__/build-xml';
import { parseKatastrDocument } from '@/modules/core/property/domain/katastr/parse-katastr-document';

const FIXTURE = readFileSync(
  join(__dirname, '__fixtures__/dum-vsechny-jednotky.xml'),
  'utf8',
);

const codes = (xml: string) => {
  const result = parseKatastrDocument(xml);
  return result.ok ? [] : result.errors.map((e) => e.code);
};

describe('parseKatastrDocument — rejections', () => {
  it('rejects a DTD declaration before parsing anything', () => {
    expect(codes(buildKatastrXml({ doctype: true }))).toEqual([
      'DTD_NOT_ALLOWED',
    ]);
  });

  it('rejects dialect B by name', () => {
    const result = parseKatastrDocument(
      buildKatastrXml({ root: 'InformaceOJednotkach' }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      code: 'UNSUPPORTED_DIALECT',
      root: 'InformaceOJednotkach',
    });
  });

  it('rejects anything else that is not a katastr document', () => {
    expect(
      codes('<?xml version="1.0"?><invoice><total>5</total></invoice>'),
    ).toEqual(['NOT_A_KATASTR_DOCUMENT']);
  });

  it('rejects a partial extract', () => {
    expect(codes(buildKatastrXml({ partial: true }))).toEqual([
      'PARTIAL_EXTRACT',
    ]);
  });

  it('rejects a share above the int32 column limit without truncating', () => {
    const result = parseKatastrDocument(
      buildKatastrXml({
        units: [{ share: { num: '1', den: '2147483648' } }],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      code: 'SHARE_OUT_OF_RANGE',
      unitNo: '132/1',
      value: '1/2147483648',
    });
  });

  it('rejects a zero denominator as malformed, not out of range, without throwing out of Rational.from', () => {
    const result = parseKatastrDocument(
      buildKatastrXml({ units: [{ share: { num: '1', den: '0' } }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    // No `value` field: SHARE_MALFORMED never echoes document text (see
    // katastr-document.ts) — unlike SHARE_OUT_OF_RANGE above, which fires
    // only after a digit check, this branch can fire before one succeeds.
    expect(result.errors[0]).toEqual({
      code: 'SHARE_MALFORMED',
      unitNo: '132/1',
    });
  });

  it('rejects a present but non-numeric numerator as malformed, not as an implied 1/1', () => {
    // The implied-1/1 rule exists for one specific situation: the cadastre
    // omits <ct:podil>, or leaves it empty, meaning "this party holds all of
    // it". A present-but-garbage numerator is not that — it is a value that
    // means nothing, and reading it as full ownership would be a guess about
    // garbage, not an interpretation of an omission. Rule 8 prefers
    // rejecting what cannot be interpreted over guessing it.
    const result = parseKatastrDocument(
      buildKatastrXml({ units: [{ share: { num: 'abc', den: '1' } }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    // No `value` field, and in particular no echo of "abc" — a non-numeric
    // numerator could just as easily be a name or an address typed into the
    // wrong element, so SHARE_MALFORMED never carries the offending text.
    expect(result.errors[0]).toEqual({
      code: 'SHARE_MALFORMED',
      unitNo: '132/1',
    });
  });

  it('rejects a share with only one half of the numerator/denominator pair present', () => {
    // <ct:jmenovatel></ct:jmenovatel> (present but empty) collapses to null
    // via text(), exactly like a fully absent element — but ct:citatel is
    // still present here ('1'), so this is not the "both absent" case that
    // IMPLIED_FULL_SHARE covers. It must land on SHARE_MALFORMED rather than
    // silently reading as an implied 1/1.
    const result = parseKatastrDocument(
      buildKatastrXml({ units: [{ share: { num: '1', den: '' } }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      code: 'SHARE_MALFORMED',
      unitNo: '132/1',
    });
  });

  it('rejects an ownership row whose subject has no ct:id, not as a zero-party share mismatch', () => {
    // Silently dropping this row would leave the unit with zero parties, and
    // the sum check would then report UNIT_SHARE_SUM { actual: '0/1' } —
    // true of the arithmetic, and useless as a diagnosis of a subject with
    // no identifier.
    const result = parseKatastrDocument(
      buildKatastrXml({ units: [{ parties: [{ subjectId: null }] }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    // No fields beyond unitNo: the subject's name and address must not
    // enter the error payload.
    expect(result.errors[0]).toEqual({
      code: 'SUBJECT_WITHOUT_ID',
      unitNo: '132/1',
    });
  });

  it('rejects an ownership row whose subject has an id but no ct:typ, not as a zero-party share mismatch', () => {
    // Same misreporting risk as the missing-id case above, but a different
    // diagnosis: SUBJECT_WITHOUT_ID would misdescribe a subject that does
    // have an identifier, and UNKNOWN_SUBJECT_TYPE's `typ` field and message
    // both presuppose a stated-but-unrecognised value, which is false here.
    const result = parseKatastrDocument(
      buildKatastrXml({ units: [{ parties: [{ omitType: true }] }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      code: 'SUBJECT_WITHOUT_TYPE',
      unitNo: '132/1',
    });
  });

  it('rejects two copies of one cadastre unit that disagree with each other', () => {
    // The parser de-duplicates jednotky by ct:id; two copies sharing an id
    // are only safe to collapse into one when they are identical. The real
    // extract's two copies always are (that is exactly why the
    // de-duplication is safe there), so this shape has to be built by hand.
    const result = parseKatastrDocument(
      buildKatastrXml({
        units: [
          { id: 'dup', number: '1' },
          { id: 'dup', number: '2' },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      code: 'INCONSISTENT_DUPLICATE_UNIT',
      katastrUnitId: 'dup',
    });
  });

  it('does not fire the duplicate-unit check when the two copies are identical', () => {
    // Mutation guard on the test above: make the two copies agree in every
    // field the parser reads, and the error must disappear — otherwise the
    // previous test would be asserting the de-duplication itself, not the
    // inconsistency check.
    const result = parseKatastrDocument(
      buildKatastrXml({
        units: [
          { id: 'dup', number: '1' },
          { id: 'dup', number: '1' },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.units).toHaveLength(1);
    expect(result.document.units[0].unitNo).toBe('132/1');
  });

  it('rejects a unit with no ownership rows', () => {
    expect(codes(buildKatastrXml({ units: [{ noOwners: true }] }))).toEqual([
      'UNIT_WITHOUT_OWNER',
    ]);
  });

  it('rejects a BSM subject missing its second spouse', () => {
    expect(
      codes(
        buildKatastrXml({
          units: [{ parties: [{ type: 'BSM', secondSpouse: false }] }],
        }),
      ),
    ).toEqual(['SJM_SHAPE_UNEXPECTED']);
  });

  it('rejects building shares that do not sum to 1/1 and reports the real sum', () => {
    const result = parseKatastrDocument(
      buildKatastrXml({
        units: [
          { share: { num: '1', den: '4' } },
          { share: { num: '1', den: '4' } },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      code: 'BUILDING_SHARE_SUM',
      actual: '1/2',
    });
  });

  it('rejects party shares that do not sum to 1/1 on one unit', () => {
    const result = parseKatastrDocument(
      buildKatastrXml({
        units: [
          {
            share: { num: '1', den: '1' },
            parties: [
              { subjectId: 'a', share: { num: '1', den: '4' } },
              { subjectId: 'b', share: { num: '1', den: '4' } },
            ],
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      code: 'UNIT_SHARE_SUM',
      unitNo: '132/1',
      actual: '1/2',
    });
  });

  it('reads an empty share as 1/1 and says so in a warning', () => {
    const result = parseKatastrDocument(
      buildKatastrXml({ units: [{ share: null, parties: [{ share: null }] }] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.units[0].buildingShare).toEqual({
      num: 1n,
      den: 1n,
    });
    expect(result.warnings).toEqual([
      { code: 'IMPLIED_FULL_SHARE', unitNo: '132/1', katastrSubjectId: null },
      { code: 'IMPLIED_FULL_SHARE', unitNo: '132/1', katastrSubjectId: 's0' },
    ]);
  });

  it('never carries a birth number out of a file that has one', () => {
    const xml = buildKatastrXml().replace(
      '<ct:rodneCislo></ct:rodneCislo>',
      '<ct:rodneCislo>7001015555</ct:rodneCislo>',
    );
    const result = parseKatastrDocument(xml);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      JSON.stringify(result.document, (_k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    ).not.toContain('7001015555');
  });

  it('reports MISSING_DOCUMENT_DATE, not a crash, when a real extract has no <ct:platnost>', () => {
    // Verified without this guard: parse returned ok:true, validAt was
    // Invalid Date, and formatAssociationDate on it produced the string
    // "NaN-NaN-NaN" rather than failing loudly.
    const xml = FIXTURE.replace(/<ct:platnost>.*?<\/ct:platnost>/, '');
    const result = parseKatastrDocument(xml);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      { code: 'MISSING_DOCUMENT_DATE', element: 'platnost' },
    ]);
  });

  it('reports MISSING_DOCUMENT_DATE, not a crash, when a real extract has no <ct:vyhotoveno>', () => {
    const xml = FIXTURE.replace(/<ct:vyhotoveno>.*?<\/ct:vyhotoveno>/, '');
    const result = parseKatastrDocument(xml);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      { code: 'MISSING_DOCUMENT_DATE', element: 'vyhotoveno' },
    ]);
  });
});
