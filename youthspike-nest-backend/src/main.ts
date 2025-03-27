import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'socket.io';
import { RedisService } from './redis/redis.service';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { EEnv, NODE_ENV } from './util/keys';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  let origin = ['http://localhost:3000', 'http://localhost:3001', 'https://studio.apollographql.com'];
  if (NODE_ENV === EEnv.PRODUCTION) {
    origin = ['https://admin.aslsquads.com', 'https://aslsquads.com', 'https://studio.apollographql.com'];
  }

  const redisService = app.get(RedisService); // ✅ Get RedisService instance

  const httpServer = app.getHttpServer();
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    perMessageDeflate: false,  // 🚀 Disable compression to prevent RSV1 error
  });

  // Apply Redis adapter from the service
  io.adapter(createAdapter(redisService.getPubClient(), redisService.getSubClient()));

  app.useWebSocketAdapter(new IoAdapter(httpServer));

  app.enableCors({
    origin, // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  app.use(graphqlUploadExpress({ maxFiles: 10, maxFileSize: 10000000 }));

  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
}
bootstrap();
