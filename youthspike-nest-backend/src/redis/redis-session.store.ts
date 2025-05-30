// src/redis/redis-session.store.ts
import { Injectable, Logger } from '@nestjs/common';
import { createClient } from 'redis';
import {RedisStore} from 'connect-redis';

@Injectable()
export class RedisSessionStore {
  private readonly logger = new Logger(RedisSessionStore.name);
  private redisStore: RedisStore;
  private redisClient: ReturnType<typeof createClient>;

  constructor() {
    this.initializeStore();
  }

  private async initializeStore() {
    // Initialize Redis client
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      socket: {
        tls: process.env.NODE_ENV === 'production',
        rejectUnauthorized: false
      }
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis client error', err);
    });

    await this.redisClient.connect()
      .then(() => this.logger.log('Connected to Redis'))
      .catch(err => this.logger.error('Redis connection error', err));

    // Initialize RedisStore
    this.redisStore = new RedisStore({
      client: this.redisClient,
      prefix: 'sess:',
      ttl: 86400, // 1 day in seconds
      disableTouch: false,
    });
  }

  getStore(): RedisStore {
    return this.redisStore;
  }

  async closeConnection(): Promise<void> {
    await this.redisClient.quit();
  }
}