import { createMock } from './factory';

/**
 * Central mock factories for all services used by the Event module.
 * Each factory returns a fresh jest.fn() map so tests don't leak state.
 */

export const mockEventService = () => ({
    create: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
});

export const mockTeamService = () => ({
    find: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
});

export const mockPlayerService = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
});

export const mockLdoService = () => ({
    findByDirectorId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
});

export const mockUserService = () => ({
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
});

export const mockSponsorService = () => ({
    find: jest.fn().mockResolvedValue([]),
    insertMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
});

export const mockGroupService = () => ({
    find: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
});

export const mockMatchService = () => ({
    find: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    insertMany: jest.fn().mockResolvedValue([]),
});

export const mockRoundService = () => ({
    find: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    insertMany: jest.fn().mockResolvedValue([]),
});

export const mockRoomService = () => ({
    find: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    insertMany: jest.fn().mockResolvedValue([]),
});

export const mockNetService = () => ({
    find: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    insertMany: jest.fn().mockResolvedValue([]),
});

export const mockPlayerStatsService = () => ({
    proStatCreate: jest.fn(),
    proStatFindOne: jest.fn(),
    proStatUpdateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    find: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    insertMany: jest.fn().mockResolvedValue([]),
});

export const mockPlayerRankingService = () => ({
    find: jest.fn().mockResolvedValue([]),
    findItems: jest.fn().mockResolvedValue([]),
    deleteManyItem: jest.fn().mockResolvedValue({ deletedCount: 1 }),
});

export const mockTemplateService = () => ({
    find: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    insertMany: jest.fn().mockResolvedValue([]),
});

export const mockBadgeService = () => ({
    find: jest.fn().mockResolvedValue([]),
    insertMany: jest.fn().mockResolvedValue([]),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
});

export const mockEmailsenderService = () => ({
    find: jest.fn().mockResolvedValue([]),
    contentFind: jest.fn().mockResolvedValue([]),
    contentDeleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    contentInsertMany: jest.fn().mockResolvedValue([]),
});

export const mockServerReceiverOnNetService = () => ({
    find: jest.fn().mockResolvedValue([]),
    findSinglePlay: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    insertMany: jest.fn().mockResolvedValue([]),
    insertManySinglePlay: jest.fn().mockResolvedValue([]),
});

export const mockCloudinaryService = () => ({
    uploadFiles: jest.fn(),
    uploadSponsors: jest.fn(),
});

export const mockConfigService = () => ({
    get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-jwt-secret';
        return null;
    }),
});

/** Archive services all share the same shape */
const archiveServiceShape = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    createMany: jest.fn().mockResolvedValue([]),
    insertMany: jest.fn().mockResolvedValue([]),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
});

export const mockArchiveServices = () => ({
    archiveTeamService: archiveServiceShape(),
    archiveMatchService: archiveServiceShape(),
    archiveGroupService: archiveServiceShape(),
    archiveSponsorService: archiveServiceShape(),
    archiveTemplateService: archiveServiceShape(),
    archivePlayerStatsService: archiveServiceShape(),
    archiveNetService: archiveServiceShape(),
    archivePlayerRankingService: archiveServiceShape(),
    archivePlayerRankingItemService: archiveServiceShape(),
    archiveRoomService: archiveServiceShape(),
    archiveRoundService: archiveServiceShape(),
    archiveServerReceiverOnNetService: archiveServiceShape(),
    archiveServerReceiverSinglePlayService: archiveServiceShape(),
    archiveEventService: archiveServiceShape(),
    archiveBadgeService: archiveServiceShape(),
    archiveEmailsenderService: archiveServiceShape(),
    archiveEmailcontentService: archiveServiceShape(),
});

export const mockEventHelpers = () => ({
    diffBadges: jest.fn().mockReturnValue({
        badgesIds: new Set<string>(),
        badgesDelete: new Set<string>(),
        badgesInsert: [],
        badgesUpdate: [],
    }),
});

export { createMock };
