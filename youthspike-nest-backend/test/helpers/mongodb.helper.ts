import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, disconnect } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

let mongoServer: MongoMemoryServer;
let mongoConnection: Connection | null = null;



export async function startInMemoryMongo(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  mongoConnection = (await connect(uri)).connection;
  return uri;
}

export async function stopInMemoryMongo(): Promise<void> {
  if (mongoConnection) {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    mongoConnection = null;
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearMongoCollections(): Promise<void> {
  if (!mongoConnection) return;
  const collections = mongoConnection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export function getMongoConnection(): Connection | null {
  return mongoConnection;
}


export async function startMongoMemoryServer() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  return uri;
}

export async function stopMongoMemoryServer() {
  if (mongoServer) await mongoServer.stop();
}

export function getMongoMemoryUri() {
  return mongoServer?.getUri();
}

/** Returns a MongooseModule.forRoot() config for in-memory Mongo */
export function getMongoMemoryModule(uri?: string) {
  return MongooseModule.forRoot(uri || (mongoServer ? mongoServer.getUri() : ''));
}
