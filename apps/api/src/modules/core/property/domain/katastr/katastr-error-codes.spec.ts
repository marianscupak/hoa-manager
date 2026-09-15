import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  ImportBlockerCode,
  ImportWarningCode,
} from '@/modules/core/property/domain/katastr/import-plan';
import type { KatastrParseErrorCode } from '@/modules/core/property/domain/katastr/katastr-document';

/**
 * `katastr-error-codes.json`, checked in beside this file, is the single
 * list both this suite and the portal's `messages.test.ts` assert against —
 * the portal cannot import these TS unions directly, since apps/portal and
 * apps/api are separate deployable apps. See the JSON file's own `_comment`.
 *
 * The `Record<Code, true>` objects below are what ties that file to the
 * real union types: assigning an object literal to `Record<Union, true>`
 * only compiles when the literal has *exactly* the union's members — one
 * missing key, or one extra key the union doesn't have, is a `tsc` error.
 * So a code added to KatastrParseError / ImportBlocker / ImportWarning
 * without a matching entry here fails the build, not just this test — and
 * a code added here (or removed) without updating the JSON fails the
 * `toEqual` assertion below instead.
 */
const CATALOGUE = JSON.parse(
  readFileSync(join(__dirname, 'katastr-error-codes.json'), 'utf8'),
) as {
  errorCodes: string[];
  blockerCodes: string[];
  warningCodes: string[];
};

const ERROR_CODES: Record<KatastrParseErrorCode, true> = {
  NOT_A_KATASTR_DOCUMENT: true,
  UNSUPPORTED_DIALECT: true,
  DTD_NOT_ALLOWED: true,
  MALFORMED_XML: true,
  UNKNOWN_SUBJECT_TYPE: true,
  PARTIAL_EXTRACT: true,
  INCONSISTENT_DUPLICATE_UNIT: true,
  SHARE_OUT_OF_RANGE: true,
  SHARE_MALFORMED: true,
  BUILDING_SHARE_SUM: true,
  UNIT_SHARE_SUM: true,
  SJM_SHAPE_UNEXPECTED: true,
  UNIT_WITHOUT_OWNER: true,
  SUBJECT_WITHOUT_ID: true,
  SUBJECT_WITHOUT_TYPE: true,
  MISSING_DOCUMENT_DATE: true,
};

const BLOCKER_CODES: Record<ImportBlockerCode, true> = {
  AMBIGUOUS_NAME: true,
  AMBIGUOUS_ICO: true,
  EFFECTIVE_DATE_TOO_EARLY: true,
  TRANSFER_ALREADY_SCHEDULED: true,
  MIXED_ASSOCIATION: true,
  UNIT_NO_COLLISION: true,
  OWNERSHIP_PLAN_REJECTED: true,
};

const WARNING_CODES: Record<ImportWarningCode, true> = {
  IMPLIED_FULL_SHARE: true,
  NAME_MATCH: true,
  KIND_MISMATCH: true,
};

describe('katastr error/blocker/warning catalogue', () => {
  it('matches katastr-error-codes.json, which the portal test also reads', () => {
    expect(Object.keys(ERROR_CODES).sort()).toEqual(
      [...CATALOGUE.errorCodes].sort(),
    );
    expect(Object.keys(BLOCKER_CODES).sort()).toEqual(
      [...CATALOGUE.blockerCodes].sort(),
    );
    expect(Object.keys(WARNING_CODES).sort()).toEqual(
      [...CATALOGUE.warningCodes].sort(),
    );
  });
});
