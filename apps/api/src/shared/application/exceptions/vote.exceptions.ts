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

export class InvalidQuestionRulesetOverrideException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_QUESTION_RULESET_OVERRIDE);
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

export class MutualDelegationNotAllowedException extends DomainException {
  constructor() {
    super(ErrorCode.MUTUAL_DELEGATION_NOT_ALLOWED);
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
