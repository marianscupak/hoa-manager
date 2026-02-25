import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from './app.module';
import { ConfigService } from './infrastructure/config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: configService.get('CORS_ORIGINS'),
    credentials: true,
  });

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

  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
