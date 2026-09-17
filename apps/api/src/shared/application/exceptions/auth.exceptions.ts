import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class UnauthorizedException extends DomainException {
  constructor() {
    super(ErrorCode.UNAUTHORIZED);
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_CREDENTIALS);
  }
}

export class InvalidTokenException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_TOKEN);
  }
}

export class ReplayAttackException extends DomainException {
  constructor() {
    super(ErrorCode.REPLAY_ATTACK);
  }
}

export class ForbiddenException extends DomainException {
  constructor() {
    super(ErrorCode.FORBIDDEN);
  }
}

/** The Google address is not the one the account signs in with. */
export class IdentityEmailMismatchException extends DomainException {
  constructor() {
    super(ErrorCode.IDENTITY_EMAIL_MISMATCH);
  }
}

/** That Google account already stands for somebody else here. */
export class IdentityAlreadyLinkedException extends DomainException {
  constructor() {
    super(ErrorCode.IDENTITY_ALREADY_LINKED);
  }
}

export class IdentityNotLinkedException extends DomainException {
  constructor() {
    super(ErrorCode.IDENTITY_NOT_LINKED);
  }
}

/** Removing it would leave the account with no way back in. */
export class LastIdentityException extends DomainException {
  constructor() {
    super(ErrorCode.LAST_IDENTITY);
  }
}
