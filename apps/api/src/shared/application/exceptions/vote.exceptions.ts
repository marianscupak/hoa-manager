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
