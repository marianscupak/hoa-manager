import * as fs from 'fs';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('HOA Manager API')
    .setDescription('The HOA Manager API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./openapi-spec.json', JSON.stringify(document, null, 2));

  await app.close();
  process.exit(0);
}

generateOpenApi();
