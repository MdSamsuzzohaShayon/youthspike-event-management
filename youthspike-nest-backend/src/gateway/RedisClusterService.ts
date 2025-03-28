import { Cluster } from 'ioredis';

class RedisClusterService {
  private static instance: Cluster;

  static getInstance(): Cluster {
    if (!this.instance) {
      console.log('🚀 Initializing Redis Cluster...');
      this.instance = new Cluster(
        [
          { host: 'localhost', port: 7000 },
          { host: 'localhost', port: 7001 },
          { host: 'localhost', port: 7002 },
        ],
        {
          dnsLookup: (address, callback) => callback(null, address),
          redisOptions: {
            enableReadyCheck: false,
            enableAutoPipelining: true,
          },
        }
      );

      this.instance.on('connect', () => console.log('✅ Connected to Redis Cluster.'));
      this.instance.on('error', (err) => console.error('❌ Redis Cluster Error:', err));
    }
    return this.instance;
  }
}

export default RedisClusterService;
