import IORedis from 'ioredis-mock';

export function createRedisMockClient(): any {
  return new IORedis({ data: {} });
}

export function createRedisMockService() {
  const pub = createRedisMockClient();
  const sub = createRedisMockClient();
  return {
    getPubClient: () => pub,
    getSubClient: () => sub,
    getClient: () => pub,
    on: () => {},
    emit: () => {},
    set: async (k: string, v: string) => pub.set(k, v),
    get: async (k: string) => pub.get(k),
    del: async (k: string) => pub.del(k),
  };
}