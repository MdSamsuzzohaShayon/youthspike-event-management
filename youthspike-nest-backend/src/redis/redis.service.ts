import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cluster } from 'ioredis';
import { EEnv, NODE_ENV } from 'src/util/keys';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private static pubClient: Cluster;
  private static subClient: Cluster;
  private readonly logger = new Logger(RedisService.name);

  private readonly nodes = [
    { port: 7000, host: '127.0.0.1' },
    { port: 7001, host: '127.0.0.1' },
    { port: 7002, host: '127.0.0.1' },
    { port: 7003, host: '127.0.0.1' },
    { port: 7004, host: '127.0.0.1' },
    { port: 7005, host: '127.0.0.1' },
  ];

  private readonly redisOptions = {
    scaleReads: 'slave' as const,
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
      // tls: NODE_ENV === EEnv.PRODUCTION ? {} : undefined,
      tls:  undefined,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    }
  };

  constructor() {
    if (!RedisService.pubClient) {
      RedisService.pubClient = new Cluster(this.nodes, {
        ...this.redisOptions,
        slotsRefreshTimeout: 2000,
      });
    }

    if (!RedisService.subClient) {
      RedisService.subClient = new Cluster(this.nodes, {
        ...this.redisOptions,
      });
    }
  }

  getPubClient(): Cluster {
    return RedisService.pubClient;
  }

  getSubClient(): Cluster {
    return RedisService.subClient;
  }

  async set(key: string, value: any, expireInSec: number = 60 * 60 * 24): Promise<void> {
    const client = this.getPubClient();
    const stringValue = JSON.stringify(value);
    if (expireInSec) {
      await client.set(key, stringValue, 'EX', expireInSec);
    } else {
      await client.set(key, stringValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const client = this.getPubClient();
    const data = await client.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  }

  async onModuleInit() {
    this.logger.log(`Redis Cluster initialized with nodes: ${this.nodes.map(n => `${n.host}:${n.port}`).join(', ')}`);
    
    // Test connection
    try {
      await RedisService.pubClient.ping();
      this.logger.log('Redis Pub Client connected successfully');
    } catch (err) {
      this.logger.error('Failed to connect to Redis Pub Client', err.stack);
    }
  }

  async onModuleDestroy() {
    try {
      await Promise.all([
        RedisService.pubClient.quit(),
        RedisService.subClient.quit(),
      ]);
      this.logger.log('Redis connections closed gracefully');
    } catch (err) {
      this.logger.error('Error closing Redis connections', err.stack);
    }
  }
}
