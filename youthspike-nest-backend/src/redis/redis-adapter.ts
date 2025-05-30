// redis-adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import * as session from 'express-session';
import * as sharedSession from 'express-socket.io-session';

export class RedisIoAdapter extends IoAdapter {
  private pubClient;
  private subClient;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(private app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis() {
    const redisService = this.app.get(RedisService);
    this.pubClient = redisService.getPubClient();
    this.subClient = redisService.getSubClient();
    this.logger.log('Redis adapter connected');
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'https://studio.apollographql.com',
          'https://admin.aslsquads.com',
          'https://aslsquads.com',
        ],
        credentials: true,
      },
    });

    // Get the session middleware from the app
    const sessionMiddleware = this.app.get(session.session);

    // Share session with socket.io
    server.use(sharedSession(sessionMiddleware, {
      autoSave: true,
      saveUninitialized: false
    }));

    // Use Redis adapter
    server.adapter(createAdapter(this.pubClient, this.subClient));
    return server;
  }
}