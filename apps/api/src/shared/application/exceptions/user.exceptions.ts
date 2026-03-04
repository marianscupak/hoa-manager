import { DomainException } from '../../errors/domain.exception';
import { ErrorCode } from '../../errors/error-codes';

export class UserInactiveException extends DomainException {
  constructor() {
    super(ErrorCode.USER_INACTIVE);
  }
}
