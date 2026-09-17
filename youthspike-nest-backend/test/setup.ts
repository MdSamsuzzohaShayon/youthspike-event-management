import * as path from 'path';

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });

jest.setTimeout(30000);