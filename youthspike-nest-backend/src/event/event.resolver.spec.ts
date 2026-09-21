import { mockEventSchema } from '../../test/mocks/schema.mock';
jest.mock('./event.schema', () => mockEventSchema);

// ADD THIS — prevents emailsender.service.ts from loading jsdom
jest.mock('src/emailsender/emailsender.service');

import { Test, TestingModule } from '@nestjs/testing';
import { EventResolver } from './event.resolver';
import { EventMutations } from './resolvers/event.mutations';
import { EventQueries } from './resolvers/event.queries';
import { EventFields } from './resolvers/event.fields';
import { mockContext, mockFileUpload } from 'test/mocks/context.mock';
import { validCreateEventInput, validUpdateEventInput } from 'test/fixtures/event.fixture';


describe('EventResolver', () => {
    let resolver: EventResolver;
    let eventMutations: jest.Mocked<EventMutations>;
    let eventQueries: jest.Mocked<EventQueries>;
    let eventFields: jest.Mocked<EventFields>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventResolver,
                { provide: EventMutations, useValue: { createEvent: jest.fn(), updateEvent: jest.fn(), cloneEvent: jest.fn(), deleteEvent: jest.fn(), restoreEvent: jest.fn(), updateEventCache: jest.fn() } },
                { provide: EventQueries, useValue: { getEvents: jest.fn(), getArchivedEvents: jest.fn(), getEventWithGroupsAndUnassignedPlayers: jest.fn(), getPlayerEventSetting: jest.fn(), getEvent: jest.fn() } },
                { provide: EventFields, useValue: { ldo: jest.fn(), teams: jest.fn(), groups: jest.fn(), sponsors: jest.fn(), players: jest.fn(), matches: jest.fn() } },
            ],
        }).compile();

        resolver = module.get(EventResolver);
        eventMutations = module.get(EventMutations);
        eventQueries = module.get(EventQueries);
        eventFields = module.get(EventFields);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── MUTATIONS ────────────────────────────────────────────────────
    describe('createEvent (mutation)', () => {
        it('delegates to eventMutations.createEvent with all args', async () => {
            const sponsorsInput: any[] = [];
            const multiplayerInput: any = { acePercentage: 10 };
            const weightInput: any = { acePercentage: 20 };
            const logo = mockFileUpload();
            const ctx = mockContext();
            const expected = { success: true };

            (eventMutations.createEvent as jest.Mock).mockResolvedValue(expected);

            const result = await resolver.createEvent(sponsorsInput, validCreateEventInput as any, ctx, multiplayerInput, weightInput, logo);

            expect(eventMutations.createEvent).toHaveBeenCalledWith({
                sponsorsInput,
                input: validCreateEventInput,
                context: ctx,
                multiplayerInput,
                weightInput,
                logo,
            });
            expect(result).toEqual(expected);
        });

        it('passes undefined for optional args when not provided', async () => {
            (eventMutations.createEvent as jest.Mock).mockResolvedValue({ success: true });
            await resolver.createEvent([], validCreateEventInput as any, mockContext());
            expect(eventMutations.createEvent).toHaveBeenCalledWith(expect.objectContaining({
                multiplayerInput: undefined,
                weightInput: undefined,
                logo: undefined,
            }));
        });
    });

    describe('updateEvent (mutation)', () => {
        it('delegates to eventMutations.updateEvent with all args', async () => {
            const ctx = mockContext();
            const sponsorsInput: any[] = [];
            const sponsorsStringInput: any[] = [];
            const multiplayerInput: any = {};
            const weightInput: any = {};
            const logo = mockFileUpload();
            const expected = { success: true };

            (eventMutations.updateEvent as jest.Mock).mockResolvedValue(expected);

            const result = await resolver.updateEvent(
                sponsorsInput, validUpdateEventInput as any, 'event-id', ctx,
                sponsorsStringInput, multiplayerInput, weightInput, logo,
            );

            expect(eventMutations.updateEvent).toHaveBeenCalledWith({
                sponsorsInput, updateInput: validUpdateEventInput, eventId: 'event-id', context: ctx,
                sponsorsStringInput, multiplayerInput, weightInput, logo,
            });
            expect(result).toEqual(expected);
        });
    });

    describe('cloneEvent (mutation)', () => {
        it('delegates to eventMutations.cloneEvent', async () => {
            (eventMutations.cloneEvent as jest.Mock).mockResolvedValue({ success: true });
            const result = await resolver.cloneEvent('event-id', validUpdateEventInput as any);
            expect(eventMutations.cloneEvent).toHaveBeenCalledWith('event-id', validUpdateEventInput);
            expect(result).toEqual({ success: true });
        });
    });

    describe('updateEventCache (mutation)', () => {
        it('delegates to eventMutations.updateEventCache', async () => {
            (eventMutations.updateEventCache as jest.Mock).mockResolvedValue({ success: true });
            await resolver.updateEventCache('event-id');
            expect(eventMutations.updateEventCache).toHaveBeenCalledWith('event-id');
        });
    });

    describe('deleteEvent (mutation)', () => {
        it('delegates to eventMutations.deleteEvent with context', async () => {
            const ctx = mockContext();
            (eventMutations.deleteEvent as jest.Mock).mockResolvedValue({ success: true, code: 204 });
            const result = await resolver.deleteEvent(ctx, 'event-id');
            expect(eventMutations.deleteEvent).toHaveBeenCalledWith(ctx, 'event-id');
            expect(result).toEqual({ success: true, code: 204 });
        });
    });

    describe('restoreEvent (mutation)', () => {
        it('delegates to eventMutations.restoreEvent with context', async () => {
            const ctx = mockContext();
            (eventMutations.restoreEvent as jest.Mock).mockResolvedValue({ success: true });
            await resolver.restoreEvent(ctx, 'event-id');
            expect(eventMutations.restoreEvent).toHaveBeenCalledWith(ctx, 'event-id');
        });
    });

    // ─── QUERIES ─────────────────────────────────────────────────────
    describe('getEvents (query)', () => {
        it('delegates to eventQueries.getEvents with context and optional directorId', async () => {
            const ctx = mockContext();
            (eventQueries.getEvents as jest.Mock).mockResolvedValue({ success: true });
            await resolver.getEvents(ctx, 'director-1');
            expect(eventQueries.getEvents).toHaveBeenCalledWith(ctx, 'director-1');
        });

        it('passes undefined when directorId is omitted', async () => {
            (eventQueries.getEvents as jest.Mock).mockResolvedValue({ success: true });
            await resolver.getEvents(mockContext());
            expect(eventQueries.getEvents).toHaveBeenCalledWith(expect.anything(), undefined);
        });
    });

    describe('getArchivedEvents (query)', () => {
        it('delegates to eventQueries.getArchivedEvents', async () => {
            (eventQueries.getArchivedEvents as jest.Mock).mockResolvedValue({ success: true });
            await resolver.getArchivedEvents(mockContext(), 'director-1');
            expect(eventQueries.getArchivedEvents).toHaveBeenCalledWith(expect.anything(), 'director-1');
        });
    });

    describe('getEventWithGroupsAndUnassignedPlayers (query)', () => {
        it('delegates to eventQueries.getEventWithGroupsAndUnassignedPlayers', async () => {
            (eventQueries.getEventWithGroupsAndUnassignedPlayers as jest.Mock).mockResolvedValue({ success: true });
            await resolver.getEventWithGroupsAndUnassignedPlayers(mockContext(), 'ldo-1');
            expect(eventQueries.getEventWithGroupsAndUnassignedPlayers).toHaveBeenCalledWith(expect.anything(), 'ldo-1');
        });
    });

    describe('getPlayerEventSetting (query)', () => {
        it('delegates to eventQueries.getPlayerEventSetting', async () => {
            (eventQueries.getPlayerEventSetting as jest.Mock).mockResolvedValue({ success: true });
            await resolver.getPlayerEventSetting(mockContext(), 'event-id');
            expect(eventQueries.getPlayerEventSetting).toHaveBeenCalledWith(expect.anything(), 'event-id');
        });
    });

    describe('getEvent (query)', () => {
        it('delegates to eventQueries.getEvent', async () => {
            (eventQueries.getEvent as jest.Mock).mockResolvedValue({ success: true });
            await resolver.getEvent('event-id');
            expect(eventQueries.getEvent).toHaveBeenCalledWith('event-id');
        });
    });

    // ─── FIELD RESOLVERS ─────────────────────────────────────────────
    describe('ResolveField ldo', () => {
        it('delegates to eventFields.ldo', async () => {
            (eventFields.ldo as jest.Mock).mockResolvedValue({ _id: 'ldo-1' });
            const event: any = { _id: 'e1' };
            await resolver.ldo(event);
            expect(eventFields.ldo).toHaveBeenCalledWith(event);
        });
    });

    describe('ResolveField teams', () => {
        it('delegates to eventFields.teams', async () => {
            (eventFields.teams as jest.Mock).mockResolvedValue([]);
            await resolver.teams({} as any);
            expect(eventFields.teams).toHaveBeenCalled();
        });
    });

    describe('ResolveField groups', () => {
        it('delegates to eventFields.groups', async () => {
            (eventFields.groups as jest.Mock).mockResolvedValue([]);
            await resolver.groups({} as any);
            expect(eventFields.groups).toHaveBeenCalled();
        });
    });

    describe('ResolveField sponsors', () => {
        it('delegates to eventFields.sponsors', async () => {
            (eventFields.sponsors as jest.Mock).mockResolvedValue([]);
            await resolver.sponsors({} as any);
            expect(eventFields.sponsors).toHaveBeenCalled();
        });
    });

    describe('ResolveField players', () => {
        it('delegates to eventFields.players', async () => {
            (eventFields.players as jest.Mock).mockResolvedValue([]);
            await resolver.players({} as any);
            expect(eventFields.players).toHaveBeenCalled();
        });
    });

    describe('ResolveField matches', () => {
        it('delegates to eventFields.matches', async () => {
            (eventFields.matches as jest.Mock).mockResolvedValue([]);
            await resolver.matches({} as any);
            expect(eventFields.matches).toHaveBeenCalled();
        });
    });
});
