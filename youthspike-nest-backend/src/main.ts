import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'socket.io';
import { RedisService } from './redis/redis.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
}
bootstrap();
