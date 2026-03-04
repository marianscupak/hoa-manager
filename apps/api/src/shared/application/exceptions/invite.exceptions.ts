import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class InviteNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.INVITE_NOT_FOUND);
  }
}

export class InviteExpiredException extends DomainException {
  constructor() {
    super(ErrorCode.INVITE_EXPIRED);
  }
}

export class InviteAlreadyAcceptedException extends DomainException {
  constructor() {
    super(ErrorCode.INVITE_ALREADY_ACCEPTED);
  }
}

export class OwnerAlreadyClaimedException extends DomainException {
  constructor() {
    super(ErrorCode.OWNER_ALREADY_CLAIMED);
  }
}

export class OwnerEmailRequiredException extends DomainException {
  constructor() {
    super(ErrorCode.OWNER_EMAIL_REQUIRED);
  }
}

export class EmailMismatchException extends DomainException {
  constructor() {
    super(ErrorCode.EMAIL_MISMATCH);
  }
}

export class EmailNotVerifiedException extends DomainException {
  constructor() {
    super(ErrorCode.EMAIL_NOT_VERIFIED);
  }
}

export class AccountExistsException extends DomainException {
  constructor() {
    super(ErrorCode.ACCOUNT_EXISTS);
  }
}
