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

export class InvalidOwnershipShareException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_OWNERSHIP_SHARE);
  }
}

export class InvalidOwnershipSumException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_OWNERSHIP_SUM);
  }
}
