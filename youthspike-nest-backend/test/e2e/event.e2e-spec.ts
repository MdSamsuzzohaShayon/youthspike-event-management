import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

import { Event, EventSchema } from '../../src/event/event.schema';
import { EventService } from '../../src/event/event.service';
import { EventMutations } from '../../src/event/resolvers/event.mutations';
import { EventQueries } from '../../src/event/resolvers/event.queries';
import { EventFields } from '../../src/event/resolvers/event.fields';
import EventHelpers from '../../src/event/resolvers/event.helpers';
import { JwtAuthGuard } from '../../src/shared/auth/jwt.guard';
import { RolesGuard } from '../../src/shared/auth/roles.guard';


import { getE2EMockProviders } from '../helpers/e2e-providers.helper';
import { sampleEventDoc, directorUser, sampleLdo } from '../fixtures/event.fixture';

/**
 * E2E: Bootstraps a NestJS app with real GraphQL endpoint + in-memory Mongo.
 * All external services are mocked. EventService + Event model are real.
 * Guards are overridden so we can test resolver logic without passport-jwt setup.
 * tokenToUser is mocked to return a fixed user payload.
 */

// Must mock tokenToUser before the module is created
jest.mock('src/utils/helper', () => ({
  ...jest.requireActual('src/utils/helper'),
  tokenToUser: jest.fn(),
}));

// Import after mock
import { tokenToUser } from 'src/utils/helper';
import { startMongoMemoryServer, stopMongoMemoryServer } from 'test/helpers';
import { EventResolver } from 'src/event/event.resolver';
const mockedTokenToUser = tokenToUser as jest.MockedFunction<typeof tokenToUser>;

const JWT_SECRET = 'test-jwt-secret';

function makeToken(payload: { _id: string; role?: string }) {
  return jwt.sign({ ...payload, passcode: null }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Event (e2e)', () => {
  let app: INestApplication;
  let eventModel: Model<Event>;
  let uri: string;

  // Service mocks we need to reference in tests
  let userService: any;
  let ldoService: any;
  let cloudinaryService: any;
  let sponsorService: any;
  let badgeService: any;
  let playerStatsService: any;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    uri = await startMongoMemoryServer();

    const mockProviders = getE2EMockProviders();

    // Extract references to service mocks we need to configure in tests
    userService = mockProviders.find((p) => p.provide.name === 'UserService')?.useValue;
    ldoService = mockProviders.find((p) => p.provide.name === 'LdoService')?.useValue;
    cloudinaryService = mockProviders.find((p) => p.provide.name === 'CloudinaryService')?.useValue;
    sponsorService = mockProviders.find((p) => p.provide.name === 'SponsorService')?.useValue;
    badgeService = mockProviders.find((p) => p.provide.name === 'BadgeService')?.useValue;
    playerStatsService = mockProviders.find((p) => p.provide.name === 'PlayerStatsService')?.useValue;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          playground: false,
          introspection: true,
        }),
      ],
      providers: [
        EventResolver,
        EventMutations,
        EventQueries,
        EventFields,
        EventHelpers,
        EventService,
        ...mockProviders,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    eventModel = moduleFixture.get(getModelToken(Event.name));
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  afterEach(async () => {
    await eventModel.deleteMany({});
    jest.clearAllMocks();
  });

  // Helper to send GraphQL queries via HTTP
  const gql = (query: string, variables: Record<string, any> = {}, token?: string) => {
    const req = request(app.getHttpServer()).post('/graphql').send({ query, variables });
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  // ══════════════════════════════════════════════════════════════
  // Query: getEvent
  // ══════════════════════════════════════════════════════════════
  describe('Query: getEvent', () => {
    const query = /* graphql */ `
      query GetEvent($eventId: String!) {
        getEvent(eventId: $eventId) {
          success
          code
          message
          data { _id name location }
        }
      }
    `;

    it('returns NOT_FOUND when event does not exist', async () => {
      const res = await gql(query, { eventId: '64f1a2b3c4d5e6f7a8b9c0d1' });
      expect(res.status).toBe(200);
      expect(res.body.data.getEvent.success).toBe(false);
      expect(res.body.data.getEvent.code).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns the event when it exists in DB', async () => {
      const doc = await eventModel.create(sampleEventDoc());
      const res = await gql(query, { eventId: doc._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.getEvent.success).toBe(true);
      expect(res.body.data.getEvent.code).toBe(HttpStatus.OK);
      expect(res.body.data.getEvent.data._id).toBe(doc._id.toString());
      expect(res.body.data.getEvent.data.name).toBe('Summer Cup 2025');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Query: getEvents
  // ══════════════════════════════════════════════════════════════
  describe('Query: getEvents', () => {
    const query = /* graphql */ `
      query GetEvents($directorId: String) {
        getEvents(directorId: $directorId) {
          success
          code
          data { _id name }
        }
      }
    `;

    it('returns all events when no token (anonymous)', async () => {
      await eventModel.create(sampleEventDoc({ name: 'E1' }));
      await eventModel.create(sampleEventDoc({ name: 'E2', _id: '64f1a2b3c4d5e6f7a8b9c0d2' }));

      const res = await gql(query, {});

      expect(res.status).toBe(200);
      expect(res.body.data.getEvents.success).toBe(true);
      expect(res.body.data.getEvents.data).toHaveLength(2);
    });

    it('filters by ldo when director token is provided', async () => {
      const directorId = '64f1a2b3c4d5e6f7a8b9c0d5';
      mockedTokenToUser.mockReturnValueOnce({ _id: directorId, passcode: null } as any);
      userService.findById.mockResolvedValueOnce(directorUser({ _id: directorId }));
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo({ _id: 'ldo-1' }));

      await eventModel.create(sampleEventDoc({ ldo: 'ldo-1', name: 'Director Event' }));
      await eventModel.create(sampleEventDoc({ ldo: 'other-ldo', name: 'Other Event', _id: '64f1a2b3c4d5e6f7a8b9c0d2' }));

      const token = makeToken({ _id: directorId, role: 'director' });
      const res = await gql(query, {}, token);

      expect(res.status).toBe(200);
      expect(res.body.data.getEvents.success).toBe(true);
      expect(res.body.data.getEvents.data).toHaveLength(1);
      expect(res.body.data.getEvents.data[0].name).toBe('Director Event');
    });

    it('returns handleError on exception', async () => {
      mockedTokenToUser.mockImplementationOnce(() => { throw new Error('boom'); });

      const res = await gql(query, {});

      expect(res.body.data.getEvents.success).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Mutation: createEvent
  // ══════════════════════════════════════════════════════════════
  describe('Mutation: createEvent', () => {
    const mutation = /* graphql */ `
      mutation CreateEvent($sponsorsInput: [EventSponsorInput!]!, $input: CreateEventInput!) {
        createEvent(sponsorsInput: $sponsorsInput, input: $input) {
          success
          code
          message
          data { _id name location }
        }
      }
    `;

    const validInput = {
      name: 'New Tournament',
      startDate: '2025-07-01',
      endDate: '2025-07-10',
      active: true,
      divisions: 'A,B',
      nets: 4,
      rounds: 3,
      playerLimit: 64,
      netVariance: 2,
      homeTeam: 'Home',
      autoAssign: true,
      autoAssignLogic: 'round-robin',
      rosterLock: 'FIRST_ROSTER_SUBMIT',
      timeout: 30,
      coachPassword: 'pass123',
      description: 'A new tournament',
      location: 'Boston',
      defaultSponsor: true,
    };

    it('returns UNAUTHORIZED when no token is provided', async () => {
      mockedTokenToUser.mockReturnValueOnce(null);

      const res = await gql(mutation, { sponsorsInput: [], input: validInput });

      expect(res.body.data.createEvent.success).toBe(false);
      expect(res.body.data.createEvent.code).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns UNAUTHORIZED when user not found in DB', async () => {
      mockedTokenToUser.mockReturnValueOnce({ _id: 'no-user', passcode: null } as any);
      userService.findById.mockResolvedValueOnce(null);

      const token = makeToken({ _id: 'no-user', role: 'director' });
      const res = await gql(mutation, { sponsorsInput: [], input: validInput }, token);

      expect(res.body.data.createEvent.code).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('creates event successfully as director', async () => {
      const directorId = '64f1a2b3c4d5e6f7a8b9c0d5';
      mockedTokenToUser.mockReturnValueOnce({ _id: directorId, passcode: null } as any);
      userService.findById.mockResolvedValueOnce(directorUser({ _id: directorId }));
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo({ director: directorId }));
      cloudinaryService.uploadFiles.mockResolvedValueOnce('logo-url');
      sponsorService.insertMany.mockResolvedValueOnce([]);

      const token = makeToken({ _id: directorId, role: 'director' });
      const res = await gql(mutation, { sponsorsInput: [], input: validInput }, token);

      expect(res.status).toBe(200);
      expect(res.body.data.createEvent.success).toBe(true);
      expect(res.body.data.createEvent.code).toBe(HttpStatus.CREATED);
      expect(res.body.data.createEvent.data._id).toBeDefined();
      expect(res.body.data.createEvent.data.name).toBe('New Tournament');

      // Verify it's persisted in DB
      const doc = await eventModel.findById(res.body.data.createEvent.data._id);
      expect(doc).not.toBeNull();
      expect(doc!.name).toBe('New Tournament');
      expect(doc!.location).toBe('Boston');
    });

    it('creates event with badges when provided', async () => {
      const directorId = '64f1a2b3c4d5e6f7a8b9c0d5';
      mockedTokenToUser.mockReturnValueOnce({ _id: directorId, passcode: null } as any);
      userService.findById.mockResolvedValueOnce(directorUser({ _id: directorId }));
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo({ director: directorId }));
      badgeService.insertMany.mockResolvedValueOnce([{ _id: 'badge-1' }]);

      const inputWithBadges = {
        ...validInput,
        badges: [{ name: 'MVP', icon: 'star', badgeFor: 'PLAYER', description: 'MVP desc' }],
      };

      const token = makeToken({ _id: directorId, role: 'director' });
      const res = await gql(mutation, { sponsorsInput: [], input: inputWithBadges }, token);

      expect(res.body.data.createEvent.success).toBe(true);
      expect(badgeService.insertMany).toHaveBeenCalled();
      expect(badgeService.updateMany).toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Mutation: deleteEvent
  // ══════════════════════════════════════════════════════════════
  describe('Mutation: deleteEvent', () => {
    const mutation = /* graphql */ `
      mutation DeleteEvent($eventId: String!) {
        deleteEvent(eventId: $eventId) {
          success
          code
          message
        }
      }
    `;

    it('returns NOT_FOUND when event does not exist', async () => {
      const res = await gql(mutation, { eventId: '64f1a2b3c4d5e6f7a8b9c0d1' });

      expect(res.body.data.deleteEvent.success).toBe(false);
      expect(res.body.data.deleteEvent.code).toBe(HttpStatus.NOT_FOUND);
    });

    it('archives and deletes the event', async () => {
      const doc = await eventModel.create(sampleEventDoc());

      const res = await gql(mutation, { eventId: doc._id.toString() });

      expect(res.body.data.deleteEvent.success).toBe(true);
      expect(res.body.data.deleteEvent.code).toBe(HttpStatus.NO_CONTENT);

      // Verify it's removed from the events collection
      const found = await eventModel.findById(doc._id);
      expect(found).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Mutation: cloneEvent
  // ══════════════════════════════════════════════════════════════
  describe('Mutation: cloneEvent', () => {
    const mutation = /* graphql */ `
      mutation CloneEvent($eventId: String!, $updateInput: UpdateEventInput!) {
        cloneEvent(eventId: $eventId, updateInput: $updateInput) {
          success
          code
          message
          data { _id name }
        }
      }
    `;

    it('returns NOT_FOUND when source event does not exist', async () => {
      const updateInput = {
        name: 'Cloned Event',
        startDate: '2025-08-01',
        endDate: '2025-08-10',
        active: true,
        divisions: 'A,B',
        nets: 4,
        rounds: 3,
        playerLimit: 64,
        netVariance: 2,
        homeTeam: 'Home',
        autoAssign: true,
        autoAssignLogic: 'round-robin',
        rosterLock: 'FIRST_ROSTER_SUBMIT',
        timeout: 30,
        coachPassword: 'pass123',
        description: 'desc',
        location: 'NYC',
        defaultSponsor: true,
      };

      const res = await gql(mutation, {
        eventId: '64f1a2b3c4d5e6f7a8b9c0d1',
        updateInput,
      });

      expect(res.body.data.cloneEvent.success).toBe(false);
      expect(res.body.data.cloneEvent.code).toBe(HttpStatus.NOT_FOUND);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Query: getEvent — GraphQL validation
  // ══════════════════════════════════════════════════════════════
  describe('GraphQL schema validation', () => {
    it('returns error for missing required argument', async () => {
      const badQuery = /* graphql */ `
        query { getEvent { success } }
      `;
      const res = await gql(badQuery, {});
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toMatch(/eventId/i);
    });

    it('returns error for unknown field', async () => {
      const badQuery = /* graphql */ `
        query { getEvent(eventId: "64f1a2b3c4d5e6f7a8b9c0d1") { success nonExistentField } }
      `;
      const res = await gql(badQuery, {});
      expect(res.body.errors).toBeDefined();
    });
  });
});