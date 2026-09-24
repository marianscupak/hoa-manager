import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from '@/app.module';
import { ConfigService } from '@/infrastructure/config/config.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Caddy is the single reverse proxy in front of the API. Trusting one hop
  // makes req.ip the client address from X-Forwarded-For, which both the
  // throttler and the audit context read; without it every request looked
  // like it came from the proxy.
  app.set('trust proxy', 1);

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: configService.get('CORS_ORIGINS'),
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('HOA Manager API')
    .setDescription('The HOA Manager API description')
    .setVersion('1.0')
    .build();

  const documentFactory = () => {
    const document = SwaggerModule.createDocument(app, config);
    cleanupOpenApiDoc(document);
    return document;
  };

  // Mounted under the /api prefix so it lands on /api/docs: in production Caddy
  // only proxies /api/* to the API and serves everything else from the portal.
  SwaggerModule.setup('docs', app, documentFactory, { useGlobalPrefix: true });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
