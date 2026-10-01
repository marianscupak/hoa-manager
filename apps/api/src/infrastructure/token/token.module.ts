import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { JwtTokenService } from '@/infrastructure/token/jwt-token.service';
import {
  TOKEN_SIGNER,
  TOKEN_VERIFIER,
} from '@/shared/application/ports/token.port';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  providers: [
    JwtTokenService,
    { provide: TOKEN_SIGNER, useExisting: JwtTokenService },
    { provide: TOKEN_VERIFIER, useExisting: JwtTokenService },
  ],
  exports: [TOKEN_SIGNER, TOKEN_VERIFIER],
})
export class TokenModule {}
