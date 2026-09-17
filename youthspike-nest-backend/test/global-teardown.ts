import { stopInMemoryMongo } from './helpers/mongodb.helper';

export default async function globalTeardown() {
    await stopInMemoryMongo();
}