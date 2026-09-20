import { stopMongoMemoryServer } from "./mongodb.helper";

export default async function () {
    await stopMongoMemoryServer();
};
