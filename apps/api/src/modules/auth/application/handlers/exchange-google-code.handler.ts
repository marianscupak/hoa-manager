import { createHash } from 'crypto';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UnauthorizedException } from '../../../../shared/application/exceptions/auth.exceptions';
import {
  CLOCK,
  type Clock,
} from '../../../../shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../../shared/application/ports/unit-of-work.port';
import { ExchangeGoogleCodeCommand } from '../commands/exchange-google-code.command';
import {
  AUTH_EXCHANGE_CODE_REPOSITORY,
  type AuthExchangeCodeRepository,
} from '../ports/auth.repository.port';
import { TOKEN_SIGNER, type TokenSigner } from '../ports/auth.utils.port';

export interface ExchangeGoogleCodeResult {
  accessToken: string;
}

@CommandHandler(ExchangeGoogleCodeCommand)
export class ExchangeGoogleCodeHandler
  implements ICommandHandler<ExchangeGoogleCodeCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(AUTH_EXCHANGE_CODE_REPOSITORY)
    private readonly exchangeCodeRepository: AuthExchangeCodeRepository,
    @Inject(TOKEN_SIGNER) private readonly tokenSigner: TokenSigner,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    command: ExchangeGoogleCodeCommand,
  ): Promise<ExchangeGoogleCodeResult> {
    return this.uow.execute(async () => {
      const codeHash = createHash('sha256').update(command.code).digest('hex');
      const exchangeCode =
        await this.exchangeCodeRepository.findByCodeHash(codeHash);

      if (!exchangeCode) {
        throw new UnauthorizedException();
      }

      if (exchangeCode.usedAt) {
        throw new UnauthorizedException();
      }

      if (exchangeCode.expiresAt < this.clock.now()) {
        throw new UnauthorizedException();
      }

      await this.exchangeCodeRepository.markUsed(exchangeCode.id);

      const accessTokenPayload = {
        sub: exchangeCode.userId,
        ...(exchangeCode.tenantId
          ? {
              tid: exchangeCode.tenantId,
              mid: exchangeCode.membershipId,
              roles: exchangeCode.roles,
            }
          : {}),
      };

      const accessToken = await this.tokenSigner.signToken(
        accessTokenPayload,
        15 * 60,
      );

      return {
        accessToken,
      };
    });
  }
}
