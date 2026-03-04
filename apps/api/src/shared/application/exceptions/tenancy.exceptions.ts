import { DomainException } from '../../errors/domain.exception';
import { ErrorCode } from '../../errors/error-codes';

export class TenantNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.TENANT_NOT_FOUND);
  }
}
