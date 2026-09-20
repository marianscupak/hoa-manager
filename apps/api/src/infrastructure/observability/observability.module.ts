import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { WinstonModule } from 'nest-winston';
import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';

import { ConfigModule } from '@/infrastructure/config/config.module';
import { ConfigService } from '@/infrastructure/config/config.service';

const correlationIdFormat = winston.format((info) => {
  const cls = ClsServiceManager.getClsService();
  if (cls.isActive()) {
    const correlationId = cls.getId();
    if (correlationId) {
      info.correlationId = correlationId;
    }
  }
  return info;
});

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get('LOG_LEVEL'),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              correlationIdFormat(),
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        ],
      }),
    }),
  ],
})
export class ObservabilityModule {}
