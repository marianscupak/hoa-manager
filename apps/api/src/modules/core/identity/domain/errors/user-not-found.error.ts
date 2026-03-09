import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class UserNotFoundError extends DomainException {
  constructor() {
    super(ErrorCode.USER_NOT_FOUND);
  }
}
