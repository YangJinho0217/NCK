import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor';
import {
  applyGlobalErrorResponses,
  applySwaggerTagGroups,
  buildOpenApiDocumentForGroup,
  swaggerConfig,
  swaggerGroupedJsonSlug,
  SWAGGER_GROUPED_OPEN_API,
} from './common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new SuccessResponseInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(cookieParser());

  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    applyGlobalErrorResponses(document);
    applySwaggerTagGroups(document);

    const swaggerUiOptions = {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list' as const,
        filter: true,
      },
    };

    SwaggerModule.setup('api-docs', app, document, swaggerUiOptions);

    for (const cfg of SWAGGER_GROUPED_OPEN_API) {
      const slug = swaggerGroupedJsonSlug(cfg.group);
      const groupDoc = buildOpenApiDocumentForGroup(document, cfg);
      applyGlobalErrorResponses(groupDoc);
      applySwaggerTagGroups(groupDoc);
      SwaggerModule.setup(`api-docs/${slug}`, app, groupDoc, swaggerUiOptions);
    }
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger: http://localhost:${port}/api-docs`);
    for (const cfg of SWAGGER_GROUPED_OPEN_API) {
      const slug = swaggerGroupedJsonSlug(cfg.group);
      console.log(`Swagger (${cfg.group}): http://localhost:${port}/api-docs/${slug}`);
    }
  }
}

bootstrap();
