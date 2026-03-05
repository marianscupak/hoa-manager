import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { WinstonModule } from 'nest-winston';
import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';

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
    WinstonModule.forRoot({
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
  ],
})
export class ObservabilityModule {}
