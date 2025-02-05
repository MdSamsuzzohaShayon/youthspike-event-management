// Follow this docs -> https://medium.com/@pp.palinda/parallel-processing-in-nestjs-6ecdbc533e1f

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { EEnv, NODE_ENV } from './util/keys';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  let origin = ['http://localhost:3000', 'http://localhost:3001', 'https://studio.apollographql.com'];
  if (NODE_ENV === EEnv.production) {
    origin = ['https://admin.aslsquads.com', 'https://aslsquads.com', 'https://studio.apollographql.com'];
  }
  // 'https://admin.aslsquads.com'

  app.enableCors({
    origin, // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  app.use(graphqlUploadExpress({ maxFiles: 10, maxFileSize: 10000000 }));

  await app.listen(4000);
}

bootstrap();