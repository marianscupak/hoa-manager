import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PasswordHasher } from '@/modules/core/auth/application/ports/auth.utils.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds = 12;
  private dummyHashPromise: Promise<string> | null = null;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async compareDummy(password: string): Promise<false> {
    if (!this.dummyHashPromise) {
      this.dummyHashPromise = bcrypt.hash(
        'dummy-password-for-timing-attack-mitigation',
        this.rounds,
      );
    }
    const dummyHash = await this.dummyHashPromise;
    await bcrypt.compare(password, dummyHash);
    return false;
  }
}
