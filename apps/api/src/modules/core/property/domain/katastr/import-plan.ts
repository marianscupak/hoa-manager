import type { Fraction } from '@/modules/core/property/domain/katastr/katastr-document';
import type {
  OwnerKind,
  OwnershipPartyType,
  OwnershipPlanError,
} from '@/modules/core/property/domain/ownership-plan';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';

export interface RegisterOwner {
  id: string;
  displayName: string;
  kind: OwnerKind;
  email: string | null;
  hasAccount: boolean;
  katastrPersonId: string | null;
  ico: string | null;
}

export interface RegisterUnit {
  id: string;
  unitNo: string;
  katastrUnitId: string | null;
  buildingShare: Fraction;
  usageCode: string | null;
  usageName: string | null;
  /** Every period — past, active and scheduled — as `listByUnit` returns them. */
  parties: UnitOwnershipParty[];
}

export interface RegisterSnapshot {
  units: RegisterUnit[];
  owners: RegisterOwner[];
}

export type OwnerAction =
  | 'CREATE'
  | 'MATCHED_BY_KATASTR_ID'
  | 'MATCHED_BY_ICO'
  | 'MATCHED_BY_NAME';

export interface PlannedOwner {
  katastrPersonId: string;
  displayName: string;
  ico: string | null;
  kind: OwnerKind;
  action: OwnerAction;
  existingOwnerId: string | null;
  existingDisplayName: string | null;
  existingEmail: string | null;
  existingHasAccount: boolean;
  /** The matched row's kind, so a promoted ASSOCIATION can be detected. */
  kindInRegister: OwnerKind | null;
  /** Write katastr_person_id onto the matched row. */
  backfillKatastrId: boolean;
  /** Write ico onto the matched row, which had none. */
  backfillIco: boolean;
}

export interface PlannedParty {
  partyType: OwnershipPartyType;
  share: Fraction;
  /** Katastr person ids; resolved to owner UUIDs at write time. */
  memberKatastrPersonIds: string[];
}

export interface PartySummary {
  partyType: OwnershipPartyType;
  /** "3819/206422", as the cadastre wrote it. */
  share: string;
  memberNames: string[];
}

export interface PlannedUnit {
  katastrUnitId: string;
  unitNo: string;
  action: 'CREATE' | 'UPDATE' | 'UNCHANGED';
  existingUnitId: string | null;
  unitNoChange: { from: string; to: string } | null;
  shareChange: { from: string; to: string } | null;
  usageChange: { from: string | null; to: string | null } | null;
  backfillKatastrId: boolean;
  ownershipChange: { from: PartySummary[]; to: PartySummary[] } | null;
  /** Parties to write; meaningful only when `ownershipChange` is set. */
  parties: PlannedParty[];
  /**
   * Values to write. Separate from the `*Change` fields above, which are
   * display pairs for the portal: an `UNCHANGED` unit has no change object at
   * all, and a writer must never parse a display string back into numbers.
   */
  buildingShare: Fraction;
  usageCodeToWrite: string | null;
  usageNameToWrite: string | null;
}

export type ImportWarning =
  | {
      code: 'IMPLIED_FULL_SHARE';
      unitNo: string;
      katastrSubjectId: string | null;
    }
  | {
      code: 'NAME_MATCH';
      katastrPersonId: string;
      fileName: string;
      registerName: string;
    }
  | {
      code: 'KIND_MISMATCH';
      katastrPersonId: string;
      registerKind: OwnerKind;
      fileKind: OwnerKind;
    };

export type ImportWarningCode = ImportWarning['code'];

export type ImportBlocker =
  | {
      code: 'AMBIGUOUS_NAME';
      name: string;
      registerOwnerIds: string[];
      katastrPersonIds: string[];
    }
  // The IČO-matching sibling of AMBIGUOUS_NAME: two or more register owners
  // share an IČO that the document also carries. A separate code rather
  // than folding this into AMBIGUOUS_NAME — that code's admin-facing message
  // is specifically about a name clash, which would misdirect the admin to
  // look at names when the real ambiguity is on IČO.
  | {
      code: 'AMBIGUOUS_ICO';
      ico: string;
      registerOwnerIds: string[];
      katastrPersonIds: string[];
    }
  | {
      code: 'EFFECTIVE_DATE_TOO_EARLY';
      unitNo: string;
      earliestAllowed: string;
    }
  | { code: 'TRANSFER_ALREADY_SCHEDULED'; unitNo: string }
  | { code: 'MIXED_ASSOCIATION'; unitNo: string; ownerName: string }
  | {
      code: 'UNIT_NO_COLLISION';
      unitNo: string;
      incomingKatastrUnitId: string;
      /** Register unit holding the number, or null for a clash inside the file. */
      heldByUnitId: string | null;
    }
  // The write-time re-check (`validateOwnershipPlan` run again with real
  // UUIDs — deliberately duplicating the diff's own structural checks, see
  // the design's Apply section) rejecting is defense-in-depth: the diff's
  // own checks should already have caught anything that reaches here. A
  // distinct code rather than reusing OwnershipPlanError's own codes
  // verbatim — that union has its own 'MIXED_ASSOCIATION' member, which
  // would collide by name with this file's 'MIXED_ASSOCIATION' above while
  // carrying neither `unitNo` nor `ownerName`, leaving the catalogue's
  // message with holes it cannot fill.
  | {
      code: 'OWNERSHIP_PLAN_REJECTED';
      unitNo: string;
      reason: OwnershipPlanError['code'];
    };

export type ImportBlockerCode = ImportBlocker['code'];

export interface ImportPlan {
  effectiveAt: Date;
  document: {
    validAt: Date;
    issuedAt: Date;
    lvNumber: string;
    municipality: string;
    cadastralArea: string;
  };
  units: PlannedUnit[];
  owners: PlannedOwner[];
  unitsNotInFile: { unitId: string; unitNo: string }[];
  ownersNotInFile: { ownerId: string; displayName: string }[];
  warnings: ImportWarning[];
  blockers: ImportBlocker[];
}
