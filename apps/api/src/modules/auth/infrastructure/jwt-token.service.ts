import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  TokenSigner,
  TokenVerifier,
  VerifyTokenOptions,
} from '../application/ports/auth.utils.port';

@Injectable()
export class JwtTokenService implements TokenSigner, TokenVerifier {
  constructor(private readonly jwtService: JwtService) {}

  async signToken(payload: object, expiresInSeconds: number): Promise<string> {
    return this.jwtService.signAsync(payload, { expiresIn: expiresInSeconds });
  }

  async verifyToken<T extends object>(
    token: string,
    options?: VerifyTokenOptions,
  ): Promise<T> {
    return this.jwtService.verifyAsync<T>(token, options);
  }
}
