import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

import { Config } from '@/infrastructure/config/config.schema';

@Injectable()
export class ConfigService {
  constructor(
    private readonly nestConfigService: NestConfigService<Config, true>,
  ) {}

  get<K extends keyof Config>(key: K): Config[K] {
    return this.nestConfigService.get(key, { infer: true });
  }
}
