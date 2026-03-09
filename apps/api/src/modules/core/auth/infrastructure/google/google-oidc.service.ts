import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Issuer, BaseClient } from 'openid-client';

import {
  GoogleOidcService,
  CodeExchangeResult,
} from '@/modules/core/auth/application/ports/google-oidc.service.port';

@Injectable()
export class GoogleOidcServiceImpl implements GoogleOidcService, OnModuleInit {
  private client!: BaseClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const googleIssuer = await Issuer.discover('https://accounts.google.com');
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      console.warn('Google OIDC environment variables are not set.');
    }

    this.client = new googleIssuer.Client({
      client_id: clientId ?? 'placeholder',
      client_secret: clientSecret ?? 'placeholder',
      redirect_uris: [redirectUri ?? 'placeholder'],
      response_types: ['code'],
    });
  }

  async getAuthorizationUrl(state: string, nonce: string): Promise<string> {
    return this.client.authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
      prompt: 'consent',
    });
  }

  async exchangeCode(
    code: string,
    expectedNonce: string,
  ): Promise<CodeExchangeResult> {
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    const tokenSet = await this.client.callback(
      redirectUri,
      { code },
      { nonce: expectedNonce },
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
