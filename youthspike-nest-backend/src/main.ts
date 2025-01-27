// Follow this docs -> https://medium.com/@pp.palinda/parallel-processing-in-nestjs-6ecdbc533e1f

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';


enum EEnv {
  development = "development",
  production = "production",
}

export const NODE_ENV: EEnv = EEnv.development;
// export const NODE_ENV: EEnv = EEnv.production;



export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: `redis://localhost:6379` });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set up redis adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  let origin = ['http://localhost:3000', 'http://localhost:3001', 'https://studio.apollographql.com'];
  if (NODE_ENV === EEnv.production) {
    origin = ['https://admin.aslsquads.com', 'https://aslsquads.com', 'https://studio.apollographql.com'];
  }
  // 'https://admin.aslsquads.com'

  app.enableCors({
    origin, // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  app.use(graphqlUploadExpress({ maxFiles: 10, maxFileSize: 10000000 }));

  await app.listen(4000);
}

bootstrap();

/*
// Clustering -> use this is there is no PM2 -> PM@ provides the same features
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { cpus } from 'node:os';
import process from 'node:process';

let cluster;
try {
  cluster = require('cluster');
} catch (e) {
  console.error('Cluster module is not available:', e);
}

enum EEnv {
  development = "development",
  production = "production",
}

export const NODE_ENV: EEnv = EEnv.development;
// export const NODE_ENV: EEnv = EEnv.production;

const numCPUs = cpus().length; // Get the number of CPU cores available

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  let origin = ['http://localhost:3000', 'http://localhost:3001', 'https://studio.apollographql.com'];
  if (NODE_ENV === EEnv.production) {
    origin = ['https://admin.aslsquads.com', 'https://aslsquads.com', 'https://studio.apollographql.com'];
  }

  app.enableCors({
    origin, // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  app.use(graphqlUploadExpress({ maxFiles: 10, maxFileSize: 10000000 }));

  await app.listen(4000);
}

// Check if the current process is the primary (master)
if (cluster && cluster.isPrimary) {
  console.log(`Primary ${process?.pid} is running`);

  // Fork worker processes based on the number of CPUs available
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exit events
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process?.pid} died`);
  });
} else {
  // In worker processes, create the NestJS app and start the server
  bootstrap().then(() => {
    console.log(`Worker ${process?.pid} started`);
  }).catch(err => {
    console.error('Error during bootstrap:', err);
  });
}
  */