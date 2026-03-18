import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class InvalidVoteScheduleException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_VOTE_SCHEDULE);
  }
}

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
