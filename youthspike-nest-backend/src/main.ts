import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from './redis/redis.service';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { EEnv, NODE_ENV } from './util/keys';
import { Logger } from '@nestjs/common';
import { ServerOptions } from 'socket.io';

class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: any;

  constructor(app: any, private redisService: RedisService) {
    super(app);
  }

  async connectToRedis() {
    const pubClient = this.redisService.getPubClient();
    const subClient = this.redisService.getSubClient();
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: NODE_ENV === EEnv.PRODUCTION
          ? ['https://admin.aslsquads.com', 'https://aslsquads.com']
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true, // For v2 client compatibility if needed
      cookie: false, // Important for load balancing
    });
  
    server.adapter(this.adapterConstructor);
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const origin =
    NODE_ENV === EEnv.PRODUCTION
      ? ['https://admin.aslsquads.com', 'https://aslsquads.com', 'https://studio.apollographql.com']
      : ['http://localhost:3000', 'http://localhost:3001', 'https://studio.apollographql.com'];

  app.enableCors({
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(graphqlUploadExpress({ maxFiles: 10, maxFileSize: 10000000 }));

  // Get RedisService instance
  const redisService = app.get(RedisService);

  // Set up RedisIoAdapter
  const redisAdapter = new RedisIoAdapter(app, redisService);
  await redisAdapter.connectToRedis(); // important!
  app.useWebSocketAdapter(redisAdapter);

  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
  logger.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
}

bootstrap();
