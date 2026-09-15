import { XMLParser } from 'fast-xml-parser';

import type {
  Fraction,
  KatastrBuilding,
  KatastrParseError,
  KatastrParseWarning,
  KatastrParty,
  KatastrPerson,
  KatastrSubjectType,
  KatastrUnit,
  ParseResult,
} from '@/modules/core/property/domain/katastr/katastr-document';
import { Rational } from '@/shared/domain/rational';

const INT32_MAX = 2147483647n;
const DIALECT_A_ROOT = 'vypisZKatastruNemovitosti';
const DIALECT_B_ROOT = 'InformaceOJednotkach';
const DIGITS = /^\d+$/;
const SUBJECT_TYPES = new Set<KatastrSubjectType>(['OFO', 'OPO', 'BSM']);

const isSubjectType = (v: string): v is KatastrSubjectType =>
  SUBJECT_TYPES.has(v as KatastrSubjectType);

/** Elements that must always be arrays, even when the file holds exactly one. */
const ALWAYS_ARRAY = new Set([
  'listVlastnictvi',
  'stavba',
  'jednotka',
  'vlastnictvi',
]);

const xml = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: true,
  // Keep every value a string: "132" must not become 132, and a 30-digit
  // denominator must not become a lossy float.
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => ALWAYS_ARRAY.has(name),
});

type Node = Record<string, unknown>;

const isNode = (v: unknown): v is Node =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Child text, or null when the element is missing or empty. */
function text(node: unknown, key: string): string | null {
  if (!isNode(node)) return null;
  const raw = node[key];
  if (raw === undefined || raw === null) return null;
  if (isNode(raw) || Array.isArray(raw)) return null;
  const value = String(raw).trim();
  return value === '' ? null : value;
}

function child(node: unknown, key: string): Node | null {
  if (!isNode(node)) return null;
  const raw = node[key];
  return isNode(raw) ? raw : null;
}

function children(node: unknown, key: string): Node[] {
  if (!isNode(node)) return [];
  const raw = node[key];
  if (Array.isArray(raw)) return raw.filter(isNode);
  return isNode(raw) ? [raw] : [];
}

/**
 * ct:platnost / ct:vyhotoveno carry no zone of their own; the cadastre
 * always emits them in UTC, hence the appended "Z". Returns null — never an
 * `Invalid Date` — for an absent, empty, or unparseable value, so the
 * caller can raise MISSING_DOCUMENT_DATE instead of letting a broken date
 * reach `toISOString()` (which throws) or `formatAssociationDate` (which
 * silently returns "NaN-NaN-NaN").
 */
function readDocumentDate(general: unknown, element: string): Date | null {
  const raw = text(general, element);
  if (raw === null) return null;
  const date = new Date(`${raw}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseKatastrDocument(source: string): ParseResult {
  if (/<!DOCTYPE/i.test(source)) {
    return { ok: false, errors: [{ code: 'DTD_NOT_ALLOWED' }] };
  }

  let tree: Node;
  try {
    tree = xml.parse(source) as Node;
  } catch {
    // Never read the thrown error's message: fast-xml-parser embeds ~50 raw
    // characters of the source document around the failure position, which
    // can carry a birth number, a name, or an address straight into an
    // output type.
    return { ok: false, errors: [{ code: 'MALFORMED_XML' }] };
  }

  const roots = Object.keys(tree).filter((k) => k !== '?xml');
  const root = roots[0] ?? '';
  if (root === DIALECT_B_ROOT) {
    return { ok: false, errors: [{ code: 'UNSUPPORTED_DIALECT', root }] };
  }
  if (root !== DIALECT_A_ROOT) {
    return { ok: false, errors: [{ code: 'NOT_A_KATASTR_DOCUMENT', root }] };
  }

  const doc = child(tree, DIALECT_A_ROOT);
  const general = child(doc, 'obecneUdaje');
  if (text(general, 'castecnyVypis') !== 'n') {
    return { ok: false, errors: [{ code: 'PARTIAL_EXTRACT' }] };
  }

  const errors: KatastrParseError[] = [];
  const warnings: KatastrParseWarning[] = [];

  // Absent, empty, or unparseable independently of everything else the
  // document holds, so checked here rather than folded into a later
  // validation pass — and pushed onto `errors` rather than returned early,
  // matching how every other structural defect in this function is handled.
  const validAt = readDocumentDate(general, 'platnost');
  if (validAt === null) {
    errors.push({ code: 'MISSING_DOCUMENT_DATE', element: 'platnost' });
  }
  const issuedAt = readDocumentDate(general, 'vyhotoveno');
  if (issuedAt === null) {
    errors.push({ code: 'MISSING_DOCUMENT_DATE', element: 'vyhotoveno' });
  }

  const lv =
    children(child(doc, 'listyVlastnictvi'), 'listVlastnictvi')[0] ?? {};
  const buildings: KatastrBuilding[] = [];
  const byId = new Map<string, { unit: KatastrUnit; raw: string }>();

  // Units come from nemovitosti/stavby/stavba only. The identical copy under
  // nemovitosti/parcely/parcela/stavba is deliberately not walked; counting both
  // doubles every share and makes the sum check reject every real file.
  const stavby = children(child(child(lv, 'nemovitosti'), 'stavby'), 'stavba');

  for (const stavba of stavby) {
    const id = text(stavba, 'id');
    if (id !== null) {
      buildings.push({
        katastrId: id,
        houseNumbers: (text(stavba, 'cislaDomovni') ?? '')
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n !== ''),
      });
    }

    for (const node of children(child(stavba, 'jednotky'), 'jednotka')) {
      const unit = readUnit(node, errors, warnings);
      if (unit === null) continue;
      const raw = JSON.stringify(node);
      const seen = byId.get(unit.katastrId);
      if (seen === undefined) {
        byId.set(unit.katastrId, { unit, raw });
      } else if (seen.raw !== raw) {
        errors.push({
          code: 'INCONSISTENT_DUPLICATE_UNIT',
          katastrUnitId: unit.katastrId,
        });
      }
    }
  }

  const units = [...byId.values()].map((v) => v.unit);

  for (const unit of units) {
    const partyTotal = Rational.sum(
      unit.parties.map((p) => Rational.from(p.share.num, p.share.den)),
    );
    if (!partyTotal.eq(Rational.one())) {
      const { num, den } = partyTotal.toJSON();
      errors.push({
        code: 'UNIT_SHARE_SUM',
        unitNo: unit.unitNo,
        actual: `${num}/${den}`,
      });
    }
  }

  if (units.length > 0) {
    const buildingTotal = Rational.sum(
      units.map((u) => Rational.from(u.buildingShare.num, u.buildingShare.den)),
    );
    if (!buildingTotal.eq(Rational.one())) {
      const { num, den } = buildingTotal.toJSON();
      errors.push({ code: 'BUILDING_SHARE_SUM', actual: `${num}/${den}` });
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    warnings,
    document: {
      // Non-null: `errors.length > 0` above already returned if either was
      // null.
      validAt: validAt!,
      issuedAt: issuedAt!,
      lvNumber: text(lv, 'cislo') ?? '',
      municipality: text(child(lv, 'obec'), 'nazev') ?? '',
      cadastralArea: text(child(lv, 'katastrUzemi'), 'nazev') ?? '',
      buildings,
      units,
    },
  };
}

function readFraction(
  node: unknown,
):
  | { fraction: Fraction; implied: boolean }
  | { tooLarge: string }
  | { malformed: true } {
  const owner = child(node, 'podil');
  const num = text(owner, 'citatel');
  const den = text(owner, 'jmenovatel');
  // An absent or empty <ct:podil> means sole ownership — the cadastre's way
  // of saying "this party holds all of it". Read it as 1/1 and let the
  // caller record a warning — never silently.
  if (num === null && den === null) {
    return { fraction: { num: 1n, den: 1n }, implied: true };
  }
  // A value that is present but is not a run of digits (including only one
  // half of the pair being present) is not "no value" — it is a value we
  // cannot interpret. Per rule 8, reject it rather than guess it means full
  // ownership: the implied-1/1 rule is specifically for the absent/empty
  // case above, not for garbage.
  //
  // No raw text is echoed here, unlike SHARE_OUT_OF_RANGE below: num/den at
  // this point are whatever text() trimmed out of ct:citatel/ct:jmenovatel,
  // completely unconstrained by the digit gate they just failed — e.g. a
  // name or a birth number typed into the wrong element. Only a fixed
  // `true` marker crosses into the returned error, the same "remove the
  // field rather than filter it" call made for MALFORMED_XML.
  if (num === null || den === null || !DIGITS.test(num) || !DIGITS.test(den)) {
    return { malformed: true };
  }
  const n = BigInt(num);
  const d = BigInt(den);
  // A zero denominator is not a range problem — it isn't a share at all, and
  // reaching Rational.from(n, 0n) would throw. Report it as SHARE_MALFORMED,
  // not SHARE_OUT_OF_RANGE: that code's admin-facing message specifically
  // describes an int32 overflow and a truncation risk, neither of which is
  // true here. Safe to have reached this point with real digits, but no
  // value is carried regardless — SHARE_MALFORMED never carries one.
  if (d === 0n) return { malformed: true };
  if (n > INT32_MAX || d > INT32_MAX) return { tooLarge: `${num}/${den}` };
  return { fraction: { num: n, den: d }, implied: false };
}

function readPerson(node: Node): KatastrPerson | null {
  const id = text(node, 'id');
  if (id === null) return null;
  const given = text(node, 'jmeno');
  const family = text(node, 'prijmeni');
  const displayName =
    given !== null && family !== null
      ? `${given} ${family}`
      : text(node, 'nazev') ?? '';
  if (displayName === '') return null;
  // ct:rodneCislo is deliberately not read.
  return { katastrPersonId: id, displayName, ico: text(node, 'ico') };
}

function readUnit(
  node: Node,
  errors: KatastrParseError[],
  warnings: KatastrParseWarning[],
): KatastrUnit | null {
  const katastrId = text(node, 'id');
  const houseNo = text(node, 'cisloDomovni');
  const number = text(node, 'cislo');
  if (katastrId === null || houseNo === null || number === null) return null;
  const unitNo = `${houseNo}/${number}`;

  const share = readFraction(node);
  if ('malformed' in share) {
    errors.push({ code: 'SHARE_MALFORMED', unitNo });
    return null;
  }
  if ('tooLarge' in share) {
    errors.push({ code: 'SHARE_OUT_OF_RANGE', unitNo, value: share.tooLarge });
    return null;
  }
  if (share.implied) {
    warnings.push({
      code: 'IMPLIED_FULL_SHARE',
      unitNo,
      katastrSubjectId: null,
    });
  }

  const usage = child(node, 'zpusobVyuziti');
  const parties: KatastrParty[] = [];
  const rows = children(child(node, 'seznamVlastnictvi'), 'vlastnictvi');
  if (rows.length === 0) {
    errors.push({ code: 'UNIT_WITHOUT_OWNER', unitNo });
    return null;
  }

  for (const row of rows) {
    const subject = child(row, 'opravnenySubjekt');
    const subjectId = text(subject, 'id');
    const typ = text(subject, 'typ');
    // No identifier at all — reject by name rather than let the row vanish
    // and have the unit's own share-sum check misreport the real problem
    // (see SUBJECT_WITHOUT_ID above).
    if (subject === null || subjectId === null) {
      errors.push({ code: 'SUBJECT_WITHOUT_ID', unitNo });
      return null;
    }
    // An id but no ct:typ at all: the same misreporting risk as the missing-
    // id case above, but a different diagnosis, so a different code (see
    // SUBJECT_WITHOUT_TYPE above) — UNKNOWN_SUBJECT_TYPE's message
    // presupposes a stated-but-unrecognised value, which is false here.
    if (typ === null) {
      errors.push({ code: 'SUBJECT_WITHOUT_TYPE', unitNo });
      return null;
    }
    if (!isSubjectType(typ)) {
      // No `typ` on the payload — see the type's own comment in
      // katastr-document.ts.
      errors.push({ code: 'UNKNOWN_SUBJECT_TYPE', unitNo });
      return null;
    }
    const type = typ;

    const partyShare = readFraction(row);
    if ('malformed' in partyShare) {
      errors.push({ code: 'SHARE_MALFORMED', unitNo });
      return null;
    }
    if ('tooLarge' in partyShare) {
      errors.push({
        code: 'SHARE_OUT_OF_RANGE',
        unitNo,
        value: partyShare.tooLarge,
      });
      return null;
    }
    if (partyShare.implied) {
      warnings.push({
        code: 'IMPLIED_FULL_SHARE',
        unitNo,
        katastrSubjectId: subjectId,
      });
    }

    const first = child(subject, 'oS');
    const second = child(subject, 'oS2');
    const members: KatastrPerson[] = [];
    for (const raw of [first, second]) {
      if (raw === null) continue;
      const person = readPerson(raw);
      if (person !== null) members.push(person);
    }

    if (type === 'BSM') {
      const bothPeople =
        text(first, 'typ') === 'OFO' && text(second, 'typ') === 'OFO';
      if (members.length !== 2 || !bothPeople) {
        errors.push({ code: 'SJM_SHAPE_UNEXPECTED', unitNo });
        return null;
      }
    } else if (members.length !== 1) {
      errors.push({ code: 'SJM_SHAPE_UNEXPECTED', unitNo });
      return null;
    }

    parties.push({
      katastrSubjectId: subjectId,
      type,
      share: partyShare.fraction,
      members,
    });
  }

  return {
    katastrId,
    unitNo,
    buildingShare: share.fraction,
    usageCode: text(usage, 'kod'),
    usageName: text(usage, 'nazev'),
    parties,
  };
}
