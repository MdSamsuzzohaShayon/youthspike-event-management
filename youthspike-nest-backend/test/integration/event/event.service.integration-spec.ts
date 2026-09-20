import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventService } from '../../../src/event/event.service';
import { Event, EventSchema } from '../../../src/event/event.schema';
import { sampleEventDoc } from '../../fixtures/event.fixture';
import { startMongoMemoryServer, stopMongoMemoryServer } from 'test/helpers';

describe('EventService (integration)', () => {
  let module: TestingModule;
  let service: EventService;
  let model: Model<Event>;
  let uri: string;

  beforeAll(async () => {
    uri = await startMongoMemoryServer();
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
      ],
      providers: [EventService],
    }).compile();

    service = module.get(EventService);
    model = module.get(getModelToken(Event.name));
  });

  afterAll(async () => {
    await module.close();
    await stopMongoMemoryServer();
  });

  afterEach(async () => {
    await model.deleteMany({});
  });

  // Helper to create a doc via the model, guaranteeing non-null
  const createDoc = async (overrides: Record<string, any> = {}) => {
    const doc = await model.create({ ...sampleEventDoc(), ...overrides });
    if (!doc) throw new Error('Failed to create test document');
    return doc;
  };

  // ─── create ────────────────────────────────────────────────────
  describe('create', () => {
    it('persists an event document', async () => {
      const input = { ...sampleEventDoc(), _id: undefined };
      const created = await service.create(input as any);

      expect(created._id).toBeDefined();
      expect(created.name).toBe(input.name);

      const found = await model.findById(created._id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe(input.name);
    });

    it('forces active=true even when input has active=false', async () => {
      const input = { ...sampleEventDoc(), _id: undefined, active: false };
      const created = await service.create(input as any);
      expect(created.active).toBe(true);
    });
  });

  // ─── findById ──────────────────────────────────────────────────
  describe('findById', () => {
    it('returns null for invalid ObjectId', async () => {
      const res = await service.findById('not-a-valid-objectid');
      expect(res).toBeNull();
    });

    it('returns null when not found', async () => {
      const res = await service.findById(new Types.ObjectId().toHexString());
      expect(res).toBeNull();
    });

    it('returns the document when it exists', async () => {
      const doc = await createDoc();
      const res = await service.findById(doc._id.toString());
      expect(res).not.toBeNull();
      expect(res!._id.toString()).toBe(doc._id.toString());
    });

    it('returns a lean document (plain object, no mongoose methods)', async () => {
      const doc = await createDoc();
      const res = await service.findById(doc._id.toString());
      // .lean() returns a plain object, not a Mongoose document
      expect(res).not.toBeInstanceOf(model);
      expect(typeof (res as { save?: unknown }).save).toBe('undefined');
    });
  });

  // ─── findByName ────────────────────────────────────────────────
  describe('findByName', () => {
    it('returns null when name is empty', async () => {
      const res = await service.findByName('');
      expect(res).toBeNull();
    });

    it('returns null when name does not match', async () => {
      await createDoc({ name: 'Summer Cup' });
      const res = await service.findByName('Winter Cup');
      expect(res).toBeNull();
    });

    it('returns the document when name matches', async () => {
      await createDoc({ name: 'Summer Cup' });
      const res = await service.findByName('Summer Cup');
      expect(res).not.toBeNull();
      expect(res!.name).toBe('Summer Cup');
    });
  });

  // ─── findOne ───────────────────────────────────────────────────
  describe('findOne', () => {
    it('returns null when no match', async () => {
      const res = await service.findOne({ name: 'Nonexistent' });
      expect(res).toBeNull();
    });

    it('returns document matching filter', async () => {
      await createDoc({ name: 'FindMe', location: 'Boston' });
      const res = await service.findOne({ name: 'FindMe' });
      expect(res).not.toBeNull();
      expect(res!.location).toBe('Boston');
    });
  });

  // ─── find ──────────────────────────────────────────────────────
  describe('find', () => {
    it('returns empty array when no documents', async () => {
      const res = await service.find({});
      expect(res).toEqual([]);
    });

    it('returns all documents with empty filter', async () => {
      await createDoc({ name: 'E1' });
      await createDoc({ name: 'E2', _id: '64f1a2b3c4d5e6f7a8b9c0d2' });
      const res = await service.find({});
      expect(res).toHaveLength(2);
    });

    it('filters by location', async () => {
      await createDoc({ name: 'E1', location: 'NYC' });
      await createDoc({ name: 'E2', location: 'Boston', _id: '64f1a2b3c4d5e6f7a8b9c0d2' });
      const res = await service.find({ location: 'NYC' } as any);
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('E1');
    });
  });

  // ─── updateOne ─────────────────────────────────────────────────
  describe('updateOne', () => {
    it('updates a single field', async () => {
      const doc = await createDoc();
      await service.updateOne({ _id: doc._id } as any, { name: 'Updated' } as any);
      const updated = await model.findById(doc._id);
      expect(updated!.name).toBe('Updated');
    });

    it('updates multiple fields', async () => {
      const doc = await createDoc();
      await service.updateOne(
        { _id: doc._id } as any,
        { name: 'New Name', location: 'New Location' } as any,
      );
      const updated = await model.findById(doc._id);
      expect(updated!.name).toBe('New Name');
      expect(updated!.location).toBe('New Location');
    });

    it('returns modifiedCount=0 when filter does not match', async () => {
      const res = await service.updateOne(
        { _id: new Types.ObjectId() } as any,
        { name: 'X' } as any,
      );
      expect(res.modifiedCount).toBe(0);
    });
  });

  // ─── updateMany ────────────────────────────────────────────────
  describe('updateMany', () => {
    it('updates multiple documents', async () => {
      await createDoc({ name: 'E1', active: true });
      await createDoc({ name: 'E2', active: true, _id: '64f1a2b3c4d5e6f7a8b9c0d2' });
      const res = await service.updateMany({ active: true } as any, { active: false } as any);
      expect(res.modifiedCount).toBe(2);
    });
  });

  // ─── deleteOne ─────────────────────────────────────────────────
  describe('deleteOne', () => {
    it('removes the document', async () => {
      const doc = await createDoc();
      await service.deleteOne({ _id: doc._id } as any);
      const found = await model.findById(doc._id);
      expect(found).toBeNull();
    });

    it('returns deletedCount=0 when filter does not match', async () => {
      const res = await service.deleteOne({ _id: new Types.ObjectId() } as any);
      expect(res.deletedCount).toBe(0);
    });
  });

  // ─── deleteMany ────────────────────────────────────────────────
  describe('deleteMany', () => {
    it('removes all matching documents', async () => {
      await createDoc({ name: 'E1', location: 'NYC' });
      await createDoc({ name: 'E2', location: 'NYC', _id: '64f1a2b3c4d5e6f7a8b9c0d2' });
      await createDoc({ name: 'E3', location: 'Boston', _id: '64f1a2b3c4d5e6f7a8b9c0d3' });

      const res = await service.deleteMany({ location: 'NYC' } as any);
      expect(res.deletedCount).toBe(2);

      const remaining = await model.find({});
      expect(remaining).toHaveLength(1);
      expect(remaining[0].location).toBe('Boston');
    });
  });

  // ─── sanitizeEvents ────────────────────────────────────────────
  describe('sanitizeEvents', () => {
    it('filters out null/falsy teams from each event', () => {
      const events = [
        { teams: [null, { _id: 't1' }, undefined, { _id: 't2' }] },
        { teams: [null] },
        { teams: [] },
        { teams: [{ _id: 't3' }] },
      ];
      const result = service.sanitizeEvents(events as any);
      expect(result[0].teams).toHaveLength(2);
      expect(result[1].teams).toHaveLength(0);
      expect(result[2].teams).toHaveLength(0);
      expect(result[3].teams).toHaveLength(1);
    });

    it('handles events with undefined teams property', () => {
      const events = [{ name: 'E1' }, { name: 'E2', teams: undefined }];
      const result = service.sanitizeEvents(events as any);
      expect(result[0].teams).toEqual([]);
      expect(result[1].teams).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      const result = service.sanitizeEvents([]);
      expect(result).toEqual([]);
    });
  });
});