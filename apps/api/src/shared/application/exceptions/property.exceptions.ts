import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class UnitNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.UNIT_NOT_FOUND);
  }
}

export class OwnerNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.OWNER_NOT_FOUND);
  }
}

export class DuplicateUnitNumberException extends DomainException {
  constructor() {
    super(ErrorCode.DUPLICATE_UNIT_NUMBER);
  }
}

export class DuplicateOwnerEmailException extends DomainException {
  constructor() {
    super(ErrorCode.DUPLICATE_OWNER_EMAIL);
  }
}

export class OwnerEmailAlreadySetException extends DomainException {
  constructor() {
    super(ErrorCode.OWNER_EMAIL_ALREADY_SET);
  }
}

export class InvalidOwnershipShareException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_OWNERSHIP_SHARE);
  }
}

export class InvalidOwnershipSumException extends DomainException {
  constructor(actualSum?: string) {
    super(
      ErrorCode.INVALID_OWNERSHIP_SUM,
      actualSum
        ? [{ code: ErrorCode.INVALID_OWNERSHIP_SUM, param: actualSum }]
        : undefined,
    );
  }
}

export class OwnershipSjmMembersInvalidException extends DomainException {
  constructor() {
    super(ErrorCode.OWNERSHIP_SJM_MEMBERS_INVALID);
  }
}

export class OwnershipMixedAssociationUnsupportedException extends DomainException {
  constructor() {
    super(ErrorCode.OWNERSHIP_MIXED_ASSOCIATION_UNSUPPORTED);
  }
}

export class OwnershipDuplicateOwnerException extends DomainException {
  constructor() {
    super(ErrorCode.OWNERSHIP_DUPLICATE_OWNER);
  }
}

export class OwnerAssociationAlreadyExistsException extends DomainException {
  constructor() {
    super(ErrorCode.OWNER_ASSOCIATION_ALREADY_EXISTS);
  }
}
