import 'dotenv/config';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { ConsultationChatService } from './Api/ConsultationChat/consultation-chat.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const jsonBodyLimit = process.env.HTTP_JSON_BODY_LIMIT ?? '40mb';
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(express.urlencoded({ limit: jsonBodyLimit, extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const chatService = app.get(ConsultationChatService);
  chatService.attach(app.getHttpServer());

  await app.listen(process.env.PORT ?? 8009, '127.0.0.1');
}
bootstrap();
