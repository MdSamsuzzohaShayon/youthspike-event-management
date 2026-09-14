# Project Information — youthspike-nest-backend

## Stack
- Framework: NestJS 12
- GraphQL: @nestjs/apollo + @nestjs/graphql (Apollo Server v5)
- Language: TypeScript 7
- Database: MongoDB via Mongoose 9
- Cache/PubSub: Redis via ioredis 6 (+ socket.io-redis-adapter)
- WebSockets: Socket.IO with custom RedisIoAdapter (see main.ts)
- Auth: JWT (passport-jwt), bcrypt, express-session + connect-redis
- File Uploads: Cloudinary, graphql-upload
- Email: @nestjs-modules/mailer (Nodemailer) + Handlebars templates
- Validation: class-validator
- HTML sanitization: isomorphic-dompurify, html-to-text
- CSV parsing: papaparse

## Source Modules (src/)
about, archive, badge, email, emailsender, event, gateway, group, ldo,
match, net, player, player-ranking, player-stats, redis, room, round,
server-receiver-on-net, shared, sponsor, team, template, user, utils

## Entry Point
src/main.ts — bootstraps NestFactory, wires RedisIoAdapter for Socket.IO,
applies graphqlUploadExpress middleware, sets CORS based on NODE_ENV,
listens on process.env.PORT || 4000.

## Environment
- NODE_ENV values: development | production | test
- Env files: .env, .env.example, .env.prod, .env.test (new)
- EEnv enum is in src/utils/keys.ts

## Test Stack
- Jest 30 + ts-jest 29
- @nestjs/testing for NestJS DI testing
- mongodb-memory-server for in-memory MongoDB
- ioredis-mock for Redis mocking
- supertest for HTTP/e2e assertions
- @faker-js/faker for fake data

## Test Strategy
- Unit tests (test/unit/<module>/): mock all dependencies (Mongoose models,
  RedisService, mailer, Cloudinary, external HTTP).
- Integration tests (test/integration/<module>/): use in-memory MongoDB,
  Redis mock, real module logic where feasible.
- E2E tests (test/e2e/<feature>/): full NestJS app via supertest,
  in-memory Mongo, GraphQL endpoints exercised via POST /graphql.

## Test Commands
- npm run test:unit
- npm run test:integration
- npm run test:e2e
- npm run test:all
- npm run test:cov

## Notes
- Existing src/app.controller.spec.ts and test/app.e2e-spec.ts are default
  NestJS scaffolds — review/replace when generating real tests.
- Jest default config previously pointed to non-existent <rootDir>/apps/;
  it has been corrected to point to <rootDir>/src and <rootDir>/test.
- main.ts uses RedisService.getPubClient()/getSubClient() — these must be
  mocked or replaced in tests that load AppModule directly.
