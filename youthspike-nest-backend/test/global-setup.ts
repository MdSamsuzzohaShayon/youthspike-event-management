import { startInMemoryMongo } from './helpers/mongodb.helper';

export default async function globalSetup() {
    const uri = await startInMemoryMongo();
    process.env.MONGODB_URI = uri;
    // eslint-disable-next-line no-console
    console.log(`🧪 In-memory MongoDB ready at ${uri}`);
}