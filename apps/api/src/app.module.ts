import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { IdentityModule } from './modules/identity/identity.module';

@Module({
  imports: [InfrastructureModule, IdentityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
