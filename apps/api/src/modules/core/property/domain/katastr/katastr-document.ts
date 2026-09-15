export interface Fraction {
  num: bigint;
  den: bigint;
}

export type KatastrSubjectType = 'OFO' | 'OPO' | 'BSM';

export interface KatastrPerson {
  katastrPersonId: string;
  /** "{jmeno} {prijmeni}" for people, ct:nazev for legal entities. */
  displayName: string;
  ico: string | null;
}

export interface KatastrParty {
  katastrSubjectId: string;
  type: KatastrSubjectType;
  share: Fraction;
  /** One member for OFO/OPO, two for BSM. */
  members: KatastrPerson[];
}

export interface KatastrUnit {
  katastrId: string;
  /** "{cisloDomovni}/{cislo}", e.g. "132/1". */
  unitNo: string;
  buildingShare: Fraction;
  usageCode: string | null;
  usageName: string | null;
  parties: KatastrParty[];
}

export interface KatastrBuilding {
  katastrId: string;
  houseNumbers: string[];
}

export interface KatastrDocument {
  /** ct:platnost — the moment the data is valid as of. */
  validAt: Date;
  /** ct:vyhotoveno — when the report was produced. */
  issuedAt: Date;
  lvNumber: string;
  municipality: string;
  cadastralArea: string;
  buildings: KatastrBuilding[];
  units: KatastrUnit[];
}

export type KatastrParseError =
  | { code: 'NOT_A_KATASTR_DOCUMENT'; root: string }
  | { code: 'UNSUPPORTED_DIALECT'; root: string }
  | { code: 'DTD_NOT_ALLOWED' }
  // No `detail` field: fast-xml-parser's thrown message embeds raw document
  // text around the failure position, which can include a birth number, a
  // name, or an address. Never surface it — a fixed code is all the caller
  // gets.
  | { code: 'MALFORMED_XML' }
  | { code: 'PARTIAL_EXTRACT' }
  | { code: 'INCONSISTENT_DUPLICATE_UNIT'; katastrUnitId: string }
  // Below the digit gate: num/den are provably digits and a slash by the
  // time this fires, so the value is safe to echo — and the design makes
  // "reject with the offending value, never truncate" an acceptance
  // criterion for this specific overflow case.
  | { code: 'SHARE_OUT_OF_RANGE'; unitNo: string; value: string }
  // A share that is present but not usable — a non-numeric numerator or
  // denominator, or a zero denominator — distinct from SHARE_OUT_OF_RANGE,
  // whose admin-facing message specifically describes an int32 overflow and
  // would be false for this case. Also distinct from an absent/empty share,
  // which is read as an implied 1/1 (see IMPLIED_FULL_SHARE): the difference
  // is "was there a value at all", not "is the value usable".
  //
  // No `value` field: unlike SHARE_OUT_OF_RANGE, this code can fire before
  // any digit check succeeds, so the offending text is unconstrained
  // document content — a name, an address, a birth number typed into the
  // wrong element. `unitNo` already tells the admin which unit to look at;
  // the same "remove the field rather than filter it" reasoning that
  // settled the MALFORMED_XML leak (see above) applies unchanged here.
  | { code: 'SHARE_MALFORMED'; unitNo: string }
  | { code: 'BUILDING_SHARE_SUM'; actual: string }
  | { code: 'UNIT_SHARE_SUM'; unitNo: string; actual: string }
  | { code: 'SJM_SHAPE_UNEXPECTED'; unitNo: string }
  // No `typ` field: the value is unbounded document text (whatever the
  // cadastre wrote in ct:typ), and once it has failed the known-subject-type
  // check it is exactly the kind of arbitrary text this parser must not put
  // in an error payload — the same "remove the field rather than filter it"
  // call made for SHARE_MALFORMED. `unitNo` already locates the problem.
  | { code: 'UNKNOWN_SUBJECT_TYPE'; unitNo: string }
  | { code: 'UNIT_WITHOUT_OWNER'; unitNo: string }
  // opravnenySubjekt with no ct:id at all — distinct from
  // UNKNOWN_SUBJECT_TYPE (an id is present; the type is not one this reader
  // knows) and from UNIT_WITHOUT_OWNER (no <ct:vlastnictvi> rows at all).
  // Silently dropping the row instead would leave the unit with one fewer
  // party, which the share-sum check then reports as "shares do not add up
  // to 1/1" — true of the arithmetic, and useless as a diagnosis of a
  // subject with no identifier. No document text carried beyond `unitNo`:
  // the subject's name and address are exactly what must not enter this.
  | { code: 'SUBJECT_WITHOUT_ID'; unitNo: string }
  // opravnenySubjekt with an id but no ct:typ at all — a different defect
  // from SUBJECT_WITHOUT_ID (naming that one here would misdescribe a
  // subject that does have an identifier) and from UNKNOWN_SUBJECT_TYPE
  // (that code's admin-facing message presupposes a stated-but-unrecognised
  // value; a missing element has no value to name).
  | { code: 'SUBJECT_WITHOUT_TYPE'; unitNo: string }
  // <ct:platnost> or <ct:vyhotoveno> absent, empty, or not a parseable
  // instant. Both feed `new Date(...)` with no guard otherwise: an absent
  // element yields `Invalid Date`, which `formatAssociationDate` turns into
  // the string "NaN-NaN-NaN" rather than failing loudly. Every other absent
  // element at this trust boundary has a code; these two get one too.
  | { code: 'MISSING_DOCUMENT_DATE'; element: 'platnost' | 'vyhotoveno' };

export type KatastrParseErrorCode = KatastrParseError['code'];

export type KatastrParseWarning = {
  code: 'IMPLIED_FULL_SHARE';
  unitNo: string;
  /** null when the implied share is the unit's building share. */
  katastrSubjectId: string | null;
};

export type ParseResult =
  | { ok: true; document: KatastrDocument; warnings: KatastrParseWarning[] }
  | { ok: false; errors: KatastrParseError[] };
