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
