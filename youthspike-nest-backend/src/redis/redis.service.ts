import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cluster } from 'ioredis';
import { EEnv, NODE_ENV } from 'src/util/keys';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private static clients: Cluster[] = [];
  private nodes = [
    { host: 'localhost', port: 7000 },
    { host: 'localhost', port: 7001 },
    { host: 'localhost', port: 7002 },
  ];
  private roundRobinIndex = 0;

  constructor() {
    if (RedisService.clients.length === 0) {
      RedisService.clients = this.nodes.map((node) => new Cluster([node]));
    }
  }

  getPubClient(): Cluster {
    const client = RedisService.clients[this.roundRobinIndex];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % RedisService.clients.length; // Rotate index
    console.log(`Publishing message on cluster node: ${this.nodes[this.roundRobinIndex].port}`);
    return client;
  }

  getSubClient(): Cluster {
    return RedisService.clients[0]; // Any node can handle subscriptions
  }

  async onModuleInit() {
    console.log(`RedisService initialized with cluster nodes: [ ${this.nodes.map((n) => n.port).join(', ')} ]`);
  }

  async onModuleDestroy() {
    for (const client of RedisService.clients) {
      await client.quit();
    }
  }
}
