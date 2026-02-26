import { DomainException } from '../../errors/domain.exception';
import { ErrorCode } from '../../errors/error-codes';

export class UnauthorizedException extends DomainException {
  constructor() {
    super(ErrorCode.UNAUTHORIZED);
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_CREDENTIALS);
  }
}

export class InvalidTokenException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_TOKEN);
  }
}

export class ReplayAttackException extends DomainException {
  constructor() {
    super(ErrorCode.REPLAY_ATTACK);
  }
}
