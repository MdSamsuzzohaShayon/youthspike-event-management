import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  let origin = ['http://localhost:3000', 'http://localhost:3001', 'https://studio.apollographql.com'];
  if (process.env.NODE_ENV === 'production') {
    origin = ['https://aslsquads.com', 'https://admin.aslsquads.com', 'https://studio.apollographql.com'];
  }


  app.enableCors({
    origin, // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // credentials: true, // Allow sending cookies from the frontend
  });
  app.use(graphqlUploadExpress({ maxFiles: 10, maxFileSize: 10000000 }));

  await app.listen(4000);
}

bootstrap();
