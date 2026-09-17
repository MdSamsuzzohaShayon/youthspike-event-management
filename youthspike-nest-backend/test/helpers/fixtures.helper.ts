import { faker } from '@faker-js/faker';

export const randomId = () => faker.database.mongodbObjectId();
export const randomEmail = () => faker.internet.email().toLowerCase();
export const randomUuid = () => faker.string.uuid();
export const futureDate = () => faker.date.future().toISOString();
export const pastDate = () => faker.date.past().toISOString();