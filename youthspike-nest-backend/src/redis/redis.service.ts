import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cluster } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private static pubClient: Cluster;
  private static subClient: Cluster;

  constructor() {
    if (!RedisService.pubClient || !RedisService.subClient) {
      RedisService.pubClient = new Cluster([
        { host: 'localhost', port: 7000 },
        { host: 'localhost', port: 7001 },
        { host: 'localhost', port: 7002 },
      ]);
      RedisService.subClient = RedisService.pubClient.duplicate();
    }
  }

  getPubClient(): Cluster {
    return RedisService.pubClient;
  }

  getSubClient(): Cluster {
    return RedisService.subClient;
  }

  async onModuleDestroy() {
    await RedisService.pubClient.quit();
    await RedisService.subClient.quit();
  }

  async onModuleInit() {
    console.log('RedisService initialized');
  }
}
