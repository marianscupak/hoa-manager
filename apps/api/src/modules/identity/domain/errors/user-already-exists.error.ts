import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class UserAlreadyExistsError extends DomainException {
  constructor() {
    super(ErrorCode.USER_ALREADY_EXISTS);
  }
}
