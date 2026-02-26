import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { IdentityModule } from '../identity/identity.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AuthController } from './api/auth.controller';
import {
  AUTH_IDENTITY_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
} from './application/ports/auth.repository.port';
import {
  PASSWORD_HASHER,
  TOKEN_SIGNER,
  TOKEN_VERIFIER,
} from './application/ports/auth.utils.port';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { SwitchTenantUseCase } from './application/use-cases/switch-tenant.use-case';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import {
  DrizzleAuthIdentityRepository,
  DrizzleAuthSessionRepository,
} from './infrastructure/persistence/drizzle-auth.repository';

@Module({
  imports: [
    TenancyModule,
    IdentityModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'fallback_secret_for_development',
        ),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_IDENTITY_REPOSITORY,
      useClass: DrizzleAuthIdentityRepository,
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: DrizzleAuthSessionRepository,
    },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SIGNER, useClass: JwtTokenService },
    { provide: TOKEN_VERIFIER, useClass: JwtTokenService },
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    SwitchTenantUseCase,
  ],
  exports: [TOKEN_VERIFIER],
})
export class AuthModule {}
