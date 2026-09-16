import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class VoteNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_NOT_FOUND);
  }
}

export class VoteNotDraftException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_NOT_DRAFT);
  }
}

export class VoteRulesetRequiredException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_RULESET_REQUIRED);
  }
}

export class VoteQuestionNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_QUESTION_NOT_FOUND);
  }
}

export class InvalidVoteQuestionException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_VOTE_QUESTION);
  }
}

export class RulesetChangeBlockedException extends DomainException {
  constructor() {
    super(ErrorCode.RULESET_CHANGE_BLOCKED);
  }
}

export class IncompleteVoteException extends DomainException {
  constructor(details: { code: ErrorCode; param?: string }[]) {
    super(ErrorCode.INCOMPLETE_VOTE, details);
  }
}

export class VoteScheduleMissingDatesException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_SCHEDULE_MISSING_DATES);
  }
}

export class VoteScheduleInPastException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_SCHEDULE_IN_PAST);
  }
}

export class VoteScheduleInvalidRangeException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_SCHEDULE_INVALID_RANGE);
  }
}

export class VoteMissingQuestionsException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_MISSING_QUESTIONS);
  }
}

export class VoteQuestionMissingOptionsException extends DomainException {
  constructor(questionTitle: string) {
    super(ErrorCode.VOTE_QUESTION_MISSING_OPTIONS, [
      { code: ErrorCode.VOTE_QUESTION_MISSING_OPTIONS, param: questionTitle },
    ]);
  }
}

export class SubLegalRulesetException extends DomainException {
  constructor(details: { code: ErrorCode; param?: string }[]) {
    super(ErrorCode.VOTE_RULESET_SUBLEGAL, details);
  }
}

export class RulesetAcknowledgementRequiredException extends DomainException {
  constructor(details: { code: ErrorCode; param?: string }[]) {
    super(ErrorCode.VOTE_RULESET_ACK_REQUIRED, details);
  }
}

export class RulesetOverrideNotStricterException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_RULESET_OVERRIDE_NOT_STRICTER);
  }
}

export class VoteWindowTooShortPerRollamException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_WINDOW_TOO_SHORT_PER_ROLLAM);
  }
}

export class VoteBuildingSharesIncompleteException extends DomainException {
  constructor(deficit: string) {
    super(ErrorCode.VOTE_BUILDING_SHARES_INCOMPLETE, [
      { code: ErrorCode.VOTE_BUILDING_SHARES_INCOMPLETE, param: deficit },
    ]);
  }
}

export class InvalidVoteStatusForDelegationException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_VOTE_STATUS_FOR_DELEGATION);
  }
}

export class NotAUnitOwnerException extends DomainException {
  constructor() {
    super(ErrorCode.NOT_A_UNIT_OWNER);
  }
}

export class MembershipHasNoAssociatedOwnerException extends DomainException {
  constructor() {
    super(ErrorCode.MEMBERSHIP_HAS_NO_ASSOCIATED_OWNER);
  }
}

export class DelegationNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.DELEGATION_NOT_FOUND);
  }
}

export class VoteNotScheduledException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_NOT_SCHEDULED);
  }
}

export class VoteNotReadyToOpenException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_NOT_READY_TO_OPEN);
  }
}

export class VoteNotOpenException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_NOT_OPEN);
  }
}

export class BallotAlreadyCastException extends DomainException {
  constructor() {
    super(ErrorCode.BALLOT_ALREADY_CAST);
  }
}

export class InvalidBallotAnswersException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_BALLOT_ANSWERS);
  }
}

export class NotUnitRepresentativeException extends DomainException {
  constructor() {
    super(ErrorCode.NOT_UNIT_REPRESENTATIVE);
  }
}

export class UnitNotEligibleException extends DomainException {
  constructor() {
    super(ErrorCode.UNIT_NOT_ELIGIBLE);
  }
}

export class VoteDocumentNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_DOCUMENT_NOT_FOUND);
  }
}

export class VoteDocumentLimitReachedException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_DOCUMENT_LIMIT_REACHED);
  }
}

export class VoteDocumentTypeNotAllowedException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_DOCUMENT_TYPE_NOT_ALLOWED);
  }
}

export class VoteDocumentTooLargeException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_DOCUMENT_TOO_LARGE);
  }
}

export class VoteDocumentUploadIncompleteException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_DOCUMENT_UPLOAD_INCOMPLETE);
  }
}

export class DocumentStorageNotConfiguredException extends DomainException {
  constructor() {
    super(ErrorCode.DOCUMENT_STORAGE_NOT_CONFIGURED);
  }
}

export class ConsentAlreadyRecordedException extends DomainException {
  constructor() {
    super(ErrorCode.CONSENT_ALREADY_RECORDED);
  }
}

/**
 * An assembly record documents a meeting that already happened. It has its own
 * path from DRAFT to CLOSED and never passes through SCHEDULED, so scheduling
 * it would apply future-date rules that cannot hold for it.
 */
export class AssemblyRecordNotSchedulableException extends DomainException {
  constructor() {
    super(ErrorCode.ASSEMBLY_RECORD_NOT_SCHEDULABLE);
  }
}

/**
 * A question added after a ballot exists would leave that ballot partial, and
 * changing `allowAbstain` rewrites the option set underneath recorded answers.
 */
export class VoteHasBallotsException extends DomainException {
  constructor() {
    super(ErrorCode.VOTE_HAS_BALLOTS);
  }
}

/** The command only makes sense for a vote recorded from a physical meeting. */
export class NotAnAssemblyRecordException extends DomainException {
  constructor() {
    super(ErrorCode.NOT_AN_ASSEMBLY_RECORD);
  }
}

/**
 * A unit the association owns casts no vote at all, and a unit with no
 * ownership on record has nobody who could have stood up in the room. Missing
 * only a common representative is different: the board settles that on the spot.
 */
export class UnitNotEligibleForAttendanceException extends DomainException {
  constructor() {
    super(ErrorCode.UNIT_NOT_ELIGIBLE_FOR_ATTENDANCE);
  }
}
