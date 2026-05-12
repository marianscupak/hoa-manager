import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Issuer, BaseClient, CallbackParamsType } from 'openid-client';

import {
  GoogleOidcService,
  CodeExchangeResult,
  GoogleCallbackParams,
} from '@/modules/core/auth/application/ports/google-oidc.service.port';
import { UnauthorizedException } from '@/shared/application/exceptions/auth.exceptions';

@Injectable()
export class GoogleOidcServiceImpl implements GoogleOidcService, OnModuleInit {
  private client: BaseClient | null = null;
  private redirectUri: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    // The config schema enforces all-or-nothing for these three.
    // If none are set, Google login is disabled and the routes will
    // 401 instead of starting a broken OIDC flow.
    if (!clientId || !clientSecret || !redirectUri) {
      return;
    }

    const googleIssuer = await Issuer.discover('https://accounts.google.com');
    this.client = new googleIssuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [redirectUri],
      response_types: ['code'],
    });
    this.redirectUri = redirectUri;
  }

  private requireClient(): BaseClient {
    if (!this.client) {
      throw new UnauthorizedException();
    }
    return this.client;
  }

  async getAuthorizationUrl(state: string, nonce: string): Promise<string> {
    return this.requireClient().authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
      prompt: 'consent',
    });
  }

  async exchangeCode(
    params: GoogleCallbackParams,
    expectedNonce: string,
    expectedState?: string,
  ): Promise<CodeExchangeResult> {
    const client = this.requireClient();

    const tokenSet = await client.callback(
      this.redirectUri!,
      params as CallbackParamsType,
      { nonce: expectedNonce, state: expectedState },
    );

    const claims = tokenSet.claims();

    return {
      idTokenPayload: {
        sub: claims.sub,
        email: claims.email as string | undefined,
        email_verified: claims.email_verified as boolean | undefined,
        name: claims.name as string | undefined,
        picture: claims.picture as string | undefined,
      },
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token,
    };
  }
}
