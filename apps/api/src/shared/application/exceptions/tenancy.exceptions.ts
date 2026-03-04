import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

export class TenantNotFoundException extends DomainException {
  constructor() {
    super(ErrorCode.TENANT_NOT_FOUND);
  }
}
