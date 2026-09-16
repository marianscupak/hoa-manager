import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';

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

/** The owner already stands for an account; overwriting silently would move
 *  the right to vote for their units without anyone noticing. */
export class OwnerAlreadyLinkedException extends DomainException {
  constructor() {
    super(ErrorCode.OWNER_ALREADY_LINKED);
  }
}

export class OwnerNotLinkedException extends DomainException {
  constructor() {
    super(ErrorCode.OWNER_NOT_LINKED);
  }
}

/** `owners_tenant_user_unique`: one account may stand for one owner. */
export class UserAlreadyLinkedToOwnerException extends DomainException {
  constructor() {
    super(ErrorCode.USER_ALREADY_LINKED_TO_OWNER);
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

export class OwnershipTransferAlreadyScheduledException extends DomainException {
  constructor() {
    super(ErrorCode.OWNERSHIP_TRANSFER_ALREADY_SCHEDULED);
  }
}

export class OwnershipEffectiveDateTooEarlyException extends DomainException {
  constructor() {
    super(ErrorCode.OWNERSHIP_EFFECTIVE_DATE_TOO_EARLY);
  }
}

export class OwnershipNoScheduledTransferException extends DomainException {
  constructor() {
    super(ErrorCode.OWNERSHIP_NO_SCHEDULED_TRANSFER);
  }
}

export class OwnerHasOwnershipRecordsException extends DomainException {
  constructor() {
    super(ErrorCode.OWNER_HAS_OWNERSHIP_RECORDS);
  }
}

export class KatastrFileRejectedException extends BadRequestException {
  constructor(errors: unknown[]) {
    super({ code: 'KATASTR_FILE_REJECTED', errors });
  }
}

export class KatastrImportBlockedException extends UnprocessableEntityException {
  constructor(blockers: unknown[]) {
    super({ code: 'KATASTR_IMPORT_BLOCKED', blockers });
  }
}

export class KatastrImportPlanStaleException extends ConflictException {
  constructor(preview: unknown) {
    super({ code: 'KATASTR_IMPORT_PLAN_STALE', preview });
  }
}
