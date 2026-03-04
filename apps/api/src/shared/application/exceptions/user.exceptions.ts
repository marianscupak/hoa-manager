import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class UserInactiveException extends DomainException {
  constructor() {
    super(ErrorCode.USER_INACTIVE);
  }
}
