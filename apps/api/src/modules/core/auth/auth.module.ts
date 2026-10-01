import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { EmailModule } from '@/infrastructure/email/email.module';
import { AuthController } from '@/modules/core/auth/api/auth.controller';
import { CreateAuthIdentityHandler } from '@/modules/core/auth/application/handlers/create-auth-identity.handler';
import { CreateSessionHandler } from '@/modules/core/auth/application/handlers/create-session.handler';
import { ExchangeGoogleCodeHandler } from '@/modules/core/auth/application/handlers/exchange-google-code.handler';
import { HandleGoogleCallbackHandler } from '@/modules/core/auth/application/handlers/handle-google-callback.handler';
import { ListIdentitiesHandler } from '@/modules/core/auth/application/handlers/list-identities.handler';
import { LoginHandler } from '@/modules/core/auth/application/handlers/login.handler';
import { LogoutHandler } from '@/modules/core/auth/application/handlers/logout.handler';
import { RefreshTokenHandler } from '@/modules/core/auth/application/handlers/refresh-token.handler';
import { RegisterAccountHandler } from '@/modules/core/auth/application/handlers/register-account.handler';
import { ResendVerificationCodeHandler } from '@/modules/core/auth/application/handlers/resend-verification-code.handler';
import { StartGoogleLoginHandler } from '@/modules/core/auth/application/handlers/start-google-login.handler';
import { SwitchTenantHandler } from '@/modules/core/auth/application/handlers/switch-tenant.handler';
import { UnlinkIdentityHandler } from '@/modules/core/auth/application/handlers/unlink-identity.handler';
import { VerifyEmailHandler } from '@/modules/core/auth/application/handlers/verify-email.handler';
import {
  AUTH_IDENTITY_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
  OIDC_LOGIN_ATTEMPT_REPOSITORY,
  AUTH_EXCHANGE_CODE_REPOSITORY,
  EMAIL_VERIFICATION_CODE_REPOSITORY,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import { PASSWORD_HASHER } from '@/modules/core/auth/application/ports/auth.utils.port';
import { GOOGLE_OIDC_SERVICE } from '@/modules/core/auth/application/ports/google-oidc.service.port';
import { SessionCleanupService } from '@/modules/core/auth/application/services/session-cleanup.service';
import { VerificationCodeService } from '@/modules/core/auth/application/services/verification-code.service';
import {
  AUTH_SESSION_SERVICE,
  AuthSessionServiceImpl,
} from '@/modules/core/auth/infrastructure/auth-session.service';
import { BcryptPasswordHasher } from '@/modules/core/auth/infrastructure/bcrypt-password-hasher';
import { GoogleOidcServiceImpl } from '@/modules/core/auth/infrastructure/google/google-oidc.service';
import {
  DrizzleAuthIdentityRepository,
  DrizzleAuthSessionRepository,
  DrizzleOidcLoginAttemptRepository,
  DrizzleAuthExchangeCodeRepository,
  DrizzleEmailVerificationCodeRepository,
} from '@/modules/core/auth/infrastructure/persistence/drizzle-auth.repository';

@Module({
  imports: [CqrsModule, EmailModule, ConfigModule],
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
    {
      provide: OIDC_LOGIN_ATTEMPT_REPOSITORY,
      useClass: DrizzleOidcLoginAttemptRepository,
    },
    {
      provide: AUTH_EXCHANGE_CODE_REPOSITORY,
      useClass: DrizzleAuthExchangeCodeRepository,
    },
    {
      provide: EMAIL_VERIFICATION_CODE_REPOSITORY,
      useClass: DrizzleEmailVerificationCodeRepository,
    },
    SessionCleanupService,
    VerificationCodeService,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: GOOGLE_OIDC_SERVICE, useClass: GoogleOidcServiceImpl },
    { provide: AUTH_SESSION_SERVICE, useClass: AuthSessionServiceImpl },
    LoginHandler,
    RegisterAccountHandler,
    VerifyEmailHandler,
    ResendVerificationCodeHandler,
    LogoutHandler,
    RefreshTokenHandler,
    SwitchTenantHandler,
    StartGoogleLoginHandler,
    UnlinkIdentityHandler,
    ListIdentitiesHandler,
    HandleGoogleCallbackHandler,
    ExchangeGoogleCodeHandler,
    CreateAuthIdentityHandler,
    CreateSessionHandler,
  ],
  exports: [PASSWORD_HASHER],
})
export class AuthModule {}
