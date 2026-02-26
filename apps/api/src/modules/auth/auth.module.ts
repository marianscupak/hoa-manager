import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

import { IdentityModule } from '../identity/identity.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AuthController } from './api/auth.controller';
import { LoginHandler } from './application/handlers/login.handler';
import { LogoutHandler } from './application/handlers/logout.handler';
import { RefreshTokenHandler } from './application/handlers/refresh-token.handler';
import { SwitchTenantHandler } from './application/handlers/switch-tenant.handler';
import {
  AUTH_IDENTITY_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
} from './application/ports/auth.repository.port';
import {
  PASSWORD_HASHER,
  TOKEN_SIGNER,
  TOKEN_VERIFIER,
} from './application/ports/auth.utils.port';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import {
  DrizzleAuthIdentityRepository,
  DrizzleAuthSessionRepository,
} from './infrastructure/persistence/drizzle-auth.repository';

@Module({
  imports: [
    CqrsModule,
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
    LoginHandler,
    LogoutHandler,
    RefreshTokenHandler,
    SwitchTenantHandler,
  ],
  exports: [TOKEN_VERIFIER],
})
export class AuthModule {}
