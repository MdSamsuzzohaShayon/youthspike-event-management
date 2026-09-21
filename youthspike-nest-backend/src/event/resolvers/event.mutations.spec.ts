import { mockEventSchema } from '../../../test/mocks/schema.mock';
jest.mock('../event.schema', () => mockEventSchema);

// ADD THIS — prevents emailsender.service.ts from loading jsdom
jest.mock('src/emailsender/emailsender.service');

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { EventMutations } from './event.mutations';
import { ConfigService } from '@nestjs/config';
import { EventService } from '../event.service';
import { TeamService } from 'src/team/team.service';
import { LdoService } from 'src/ldo/ldo.service';
import { PlayerService } from 'src/player/player.service';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { MatchService } from 'src/match/match.service';
import { UserService } from 'src/user/user.service';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { GroupService } from 'src/group/group.service';
import { RoomService } from 'src/room/room.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { TemplateService } from 'src/template/template.service';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { BadgeService } from 'src/badge/badge.service';
import { EmailsenderService } from 'src/emailsender/emailsender.service';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { ServerReceiverOnNetService } from 'src/server-receiver-on-net/server-receiver-on-net.service';
import {
  ArchiveBadgeService, ArchiveEmailcontentService, ArchiveEmailsenderService, ArchiveEventService,
  ArchiveGroupService, ArchiveMatchService, ArchiveNetService, ArchivePlayerRankingItemService,
  ArchivePlayerRankingService, ArchivePlayerStatsService, ArchiveRoomService, ArchiveRoundService,
  ArchiveServerReceiverOnNetService, ArchiveServerReceiverSinglePlayService, ArchiveSponsorService,
  ArchiveTeamService, ArchiveTemplateService,
} from 'src/archive/archive.service';
import EventHelpers from './event.helpers';
import * as helperModule from 'src/utils/helper';

import {
  validCreateEventInput, validUpdateEventInput, sampleEventDoc, directorUser, adminUser, sampleLdo,
} from '../../../test/fixtures/event.fixture';
import { mockContext } from '../../../test/mocks/context.mock';
import {
  mockEventService, mockTeamService, mockLdoService, mockPlayerService, mockPlayerStatsService,
  mockMatchService, mockUserService, mockSponsorService, mockGroupService, mockRoomService,
  mockRoundService, mockNetService, mockTemplateService, mockPlayerRankingService, mockBadgeService,
  mockEmailsenderService, mockCloudinaryService, mockConfigService, mockArchiveServices,
  mockEventHelpers, mockServerReceiverOnNetService,
} from '../../../test/mocks/services.mock';

jest.mock('src/utils/helper'); // mock tokenToUser

describe('EventMutations', () => {
  let service: EventMutations;
  let eventService: ReturnType<typeof mockEventService>;
  let userService: ReturnType<typeof mockUserService>;
  let ldoService: ReturnType<typeof mockLdoService>;
  let cloudinaryService: ReturnType<typeof mockCloudinaryService>;
  let sponsorService: ReturnType<typeof mockSponsorService>;
  let badgeService: ReturnType<typeof mockBadgeService>;
  let playerStatsService: ReturnType<typeof mockPlayerStatsService>;
  let teamService: ReturnType<typeof mockTeamService>;
  let matchService: ReturnType<typeof mockMatchService>;
  let groupService: ReturnType<typeof mockGroupService>;
  let eventHelpers: ReturnType<typeof mockEventHelpers>;
  let archives: ReturnType<typeof mockArchiveServices>;

  beforeEach(async () => {
    jest.clearAllMocks();

    eventService = mockEventService();
    userService = mockUserService();
    ldoService = mockLdoService();
    cloudinaryService = mockCloudinaryService();
    sponsorService = mockSponsorService();
    badgeService = mockBadgeService();
    playerStatsService = mockPlayerStatsService();
    teamService = mockTeamService();
    matchService = mockMatchService();
    groupService = mockGroupService();
    eventHelpers = mockEventHelpers();
    archives = mockArchiveServices();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventMutations,
        { provide: ConfigService, useValue: mockConfigService() },
        { provide: EventService, useValue: eventService },
        { provide: TeamService, useValue: teamService },
        { provide: LdoService, useValue: ldoService },
        { provide: PlayerService, useValue: mockPlayerService() },
        { provide: PlayerStatsService, useValue: playerStatsService },
        { provide: MatchService, useValue: matchService },
        { provide: UserService, useValue: userService },
        { provide: SponsorService, useValue: sponsorService },
        { provide: GroupService, useValue: groupService },
        { provide: RoomService, useValue: mockRoomService() },
        { provide: RoundService, useValue: mockRoundService() },
        { provide: NetService, useValue: mockNetService() },
        { provide: PlayerRankingService, useValue: mockPlayerRankingService() },
        { provide: TemplateService, useValue: mockTemplateService() },
        { provide: BadgeService, useValue: badgeService },
        { provide: EmailsenderService, useValue: mockEmailsenderService() },
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: ServerReceiverOnNetService, useValue: mockServerReceiverOnNetService() },
        { provide: ArchiveTeamService, useValue: archives.archiveTeamService },
        { provide: ArchiveMatchService, useValue: archives.archiveMatchService },
        { provide: ArchiveGroupService, useValue: archives.archiveGroupService },
        { provide: ArchiveSponsorService, useValue: archives.archiveSponsorService },
        { provide: ArchiveTemplateService, useValue: archives.archiveTemplateService },
        { provide: ArchivePlayerStatsService, useValue: archives.archivePlayerStatsService },
        { provide: ArchiveNetService, useValue: archives.archiveNetService },
        { provide: ArchivePlayerRankingService, useValue: archives.archivePlayerRankingService },
        { provide: ArchivePlayerRankingItemService, useValue: archives.archivePlayerRankingItemService },
        { provide: ArchiveRoomService, useValue: archives.archiveRoomService },
        { provide: ArchiveRoundService, useValue: archives.archiveRoundService },
        { provide: ArchiveServerReceiverOnNetService, useValue: archives.archiveServerReceiverOnNetService },
        { provide: ArchiveServerReceiverSinglePlayService, useValue: archives.archiveServerReceiverSinglePlayService },
        { provide: ArchiveEventService, useValue: archives.archiveEventService },
        { provide: ArchiveBadgeService, useValue: archives.archiveBadgeService },
        { provide: ArchiveEmailsenderService, useValue: archives.archiveEmailsenderService },
        { provide: ArchiveEmailcontentService, useValue: archives.archiveEmailcontentService },
        { provide: EventHelpers, useValue: eventHelpers },
      ],
    }).compile();

    service = module.get(EventMutations);
  });

  // ════════════════════════════════════════════════════════════════
  // createEvent
  // ════════════════════════════════════════════════════════════════
  describe('createEvent', () => {
    const baseBody = {
      sponsorsInput: [],
      input: validCreateEventInput,
      context: mockContext(),
    };

    it('returns unauthorized when tokenToUser returns no _id', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({});
      const res = await service.createEvent(baseBody as any);
      expect(res.success).toBe(false);
      expect(res.code).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns unauthorized when user not found in DB', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'no-user' });
      userService.findById.mockResolvedValueOnce(null);
      const res = await service.createEvent(baseBody as any);
      expect(res.success).toBe(false);
      expect(res.code).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns error when admin role submits without ldo', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'admin-id' });
      userService.findById.mockResolvedValueOnce(adminUser());
      const res = await service.createEvent({ ...baseBody, input: { ...validCreateEventInput } } as any);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/LDO id/i);
    });

    it('returns error when LDO not found for director', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findById.mockResolvedValueOnce(directorUser());
      ldoService.findByDirectorId.mockResolvedValueOnce(null);
      const res = await service.createEvent(baseBody as any);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/league director/i);
    });

    it('uploads sponsors and logo to cloudinary, creates sponsor docs, and creates event', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findById.mockResolvedValueOnce(directorUser());
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo());

      cloudinaryService.uploadSponsors.mockResolvedValue({ company: 'c1', logo: 'url-1' });
      cloudinaryService.uploadFiles.mockResolvedValue('logo-url');
      sponsorService.insertMany.mockResolvedValue([{ _id: 'sponsor-1' }]);
      eventService.create.mockResolvedValue(sampleEventDoc());
      // FIX: proStatCreate must return an object with _id, otherwise
      // source code crashes at: multiplayer._id (undefined._id)
      playerStatsService.proStatCreate.mockResolvedValue({ _id: 'ps-1' });

      const res = await service.createEvent({
        ...baseBody,
        sponsorsInput: [{ company: 'c1', logo: {} as any }] as any,
        logo: { createReadStream: () => {} } as any,
        multiplayerInput: { acePercentage: 10 } as any,
        weightInput: { acePercentage: 20 } as any,
      } as any);

      expect(cloudinaryService.uploadSponsors).toHaveBeenCalledTimes(1);
      expect(cloudinaryService.uploadFiles).toHaveBeenCalledTimes(1);
      expect(sponsorService.insertMany).toHaveBeenCalledTimes(1);
      expect(eventService.create).toHaveBeenCalled();
      expect(playerStatsService.proStatCreate).toHaveBeenCalledTimes(2);
      expect(ldoService.update).toHaveBeenCalled();
      expect(eventService.updateOne).toHaveBeenCalled();
      expect(res.success).toBe(true);
      expect(res.code).toBe(HttpStatus.CREATED);
    });

    it('returns handleError response when an exception is thrown', async () => {
      (helperModule.tokenToUser as jest.Mock).mockImplementationOnce(() => { throw new Error('boom'); });
      const res = await service.createEvent(baseBody as any);
      expect(res.success).toBe(false);
    });

    it('creates badges when input.badges provided', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findById.mockResolvedValueOnce(directorUser());
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo());
      eventService.create.mockResolvedValue(sampleEventDoc());
      badgeService.insertMany.mockResolvedValue([{ _id: 'badge-1' }, { _id: 'badge-2' }]);

      const res = await service.createEvent({
        ...baseBody,
        input: { ...validCreateEventInput, badges: [{ name: 'MVP', icon: 'x', badgeFor: 'PLAYER', description: 'd' }] as any },
      } as any);

      expect(badgeService.insertMany).toHaveBeenCalled();
      expect(badgeService.updateMany).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });

    it('skips stats creation when multiplayer/weight not provided', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findById.mockResolvedValueOnce(directorUser());
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo());
      eventService.create.mockResolvedValue(sampleEventDoc());

      await service.createEvent(baseBody as any);

      expect(playerStatsService.proStatCreate).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // updateEvent
  // ════════════════════════════════════════════════════════════════
  describe('updateEvent', () => {
    const baseBody = {
      sponsorsInput: [],
      updateInput: { ...validUpdateEventInput },
      eventId: 'event-id',
      context: mockContext(),
      sponsorsStringInput: [],
    };

    it('returns unauthorized when no _id in token', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({});
      const res = await service.updateEvent(baseBody as any);
      expect(res.code).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns unauthorized when user not found', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'u1' });
      userService.findById.mockResolvedValueOnce(null);
      const res = await service.updateEvent(baseBody as any);
      expect(res.code).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns not found when event does not exist', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'u1' });
      userService.findById.mockResolvedValueOnce(directorUser());
      eventService.findById.mockResolvedValueOnce(null);
      const res = await service.updateEvent(baseBody as any);
      expect(res.code).toBe(HttpStatus.NOT_FOUND);
    });

    it('updates event successfully as director', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findById.mockResolvedValueOnce(directorUser());
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo());
      badgeService.find.mockResolvedValueOnce([]);
      eventService.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());

      const res = await service.updateEvent(baseBody as any);

      expect(res.success).toBe(true);
      expect(res.code).toBe(HttpStatus.ACCEPTED);
      expect(eventService.updateOne).toHaveBeenCalled();
    });

    it('uses admin role path and sets directorId from existing event ldo', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'admin-id' });
      userService.findById.mockResolvedValueOnce(adminUser());
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo());
      badgeService.find.mockResolvedValueOnce([]);
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());

      const res = await service.updateEvent(baseBody as any);
      expect(res.success).toBe(true);
      expect(ldoService.findByDirectorId).toHaveBeenCalledWith(sampleEventDoc().ldo);
    });

    it('handles logo upload when logo provided', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findById.mockResolvedValueOnce(directorUser());
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo());
      badgeService.find.mockResolvedValueOnce([]);
      cloudinaryService.uploadFiles.mockResolvedValueOnce('new-logo-url');
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());

      const res = await service.updateEvent({
        ...baseBody,
        logo: { createReadStream: () => {} } as any,
      } as any);

      expect(cloudinaryService.uploadFiles).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });

    it('handles division update (rename) by calling updateMany across modules', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findById.mockResolvedValueOnce(directorUser());
      const existingEvent = sampleEventDoc({ divisions: 'A, B' });
      eventService.findById.mockResolvedValueOnce(existingEvent);
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo());
      badgeService.find.mockResolvedValueOnce([]);
      eventService.findById.mockResolvedValueOnce(existingEvent);

      await service.updateEvent({
        ...baseBody,
        updateInput: { ...validUpdateEventInput, updatedivisions: [{ prev: 'A', new: 'AA' }] } as any,
      } as any);

      expect(teamService.updateMany).toHaveBeenCalled();
      expect(groupService.updateMany).toHaveBeenCalled();
      expect(matchService.updateMany).toHaveBeenCalled();
    });

    it('throws and returns handleError when an unexpected error occurs', async () => {
      (helperModule.tokenToUser as jest.Mock).mockImplementationOnce(() => { throw new Error('boom'); });
      const res = await service.updateEvent(baseBody as any);
      expect(res.success).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // cloneEvent
  // ════════════════════════════════════════════════════════════════
  describe('cloneEvent', () => {
    it('returns not found when event does not exist', async () => {
      eventService.findOne.mockResolvedValueOnce(null);
      const res = await service.cloneEvent('no-event', validUpdateEventInput as any);
      expect(res.code).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns not found when player stats missing', async () => {
      eventService.findOne.mockResolvedValueOnce(sampleEventDoc());
      playerStatsService.proStatFindOne.mockResolvedValueOnce(null);
      const res = await service.cloneEvent('event-id', validUpdateEventInput as any);
      expect(res.code).toBe(HttpStatus.NOT_FOUND);
      expect(res.message).toMatch(/PlayerStats/i);
    });

    it('creates new event and new stats, updates ldo/teams/players', async () => {
      const event = sampleEventDoc();
      eventService.findOne.mockResolvedValueOnce(event);
      playerStatsService.proStatFindOne.mockResolvedValue({ _id: 'ps-1', acePercentage: 5 });
      const newEvent = sampleEventDoc({ _id: 'new-event-id' });
      eventService.create.mockResolvedValueOnce(newEvent);
      playerStatsService.proStatCreate
        .mockResolvedValueOnce({ _id: 'new-ps-m' })
        .mockResolvedValueOnce({ _id: 'new-ps-w' });

      const res = await service.cloneEvent('event-id', validUpdateEventInput as any);

      expect(eventService.create).toHaveBeenCalled();
      expect(playerStatsService.proStatCreate).toHaveBeenCalledTimes(2);
      expect(eventService.updateOne).toHaveBeenCalled();
      expect(ldoService.updateOne).toHaveBeenCalled();
      expect(res.success).toBe(true);
      expect(res.code).toBe(HttpStatus.ACCEPTED);
    });

    it('returns handleError response on exception', async () => {
      eventService.findOne.mockRejectedValueOnce(new Error('db down'));
      const res = await service.cloneEvent('event-id', validUpdateEventInput as any);
      expect(res.success).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // deleteEvent
  // ════════════════════════════════════════════════════════════════
  describe('deleteEvent', () => {
    it('returns not found when event does not exist', async () => {
      eventService.findById.mockResolvedValueOnce(null);
      const res = await service.deleteEvent(mockContext(), 'event-id');
      expect(res.code).toBe(HttpStatus.NOT_FOUND);
    });

    it('archives matches/groups/sponsors/templates/playerStats/badges/nets and deletes original', async () => {
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());
      teamService.find.mockResolvedValueOnce([{ _id: 't1' }]);
      matchService.find.mockResolvedValueOnce([{ _id: 'm1' }]);
      groupService.find.mockResolvedValueOnce([{ _id: 'g1' }]);
      sponsorService.find.mockResolvedValueOnce([{ _id: 's1' }]);

      const res = await service.deleteEvent(mockContext(), 'event-id');

      expect(archives.archiveMatchService.insertMany).toHaveBeenCalled();
      expect(matchService.deleteMany).toHaveBeenCalled();
      expect(archives.archiveGroupService.insertMany).toHaveBeenCalled();
      expect(groupService.deleteMany).toHaveBeenCalled();
      expect(eventService.deleteOne).toHaveBeenCalledWith({ _id: 'event-id' });
      expect(res.success).toBe(true);
      expect(res.code).toBe(HttpStatus.NO_CONTENT);
    });

    it('returns handleError response on exception', async () => {
      eventService.findById.mockRejectedValueOnce(new Error('boom'));
      const res = await service.deleteEvent(mockContext(), 'event-id');
      expect(res.success).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // restoreEvent
  // ════════════════════════════════════════════════════════════════
  describe('restoreEvent', () => {
    it('returns not found when archived event does not exist', async () => {
      archives.archiveEventService.findOne.mockResolvedValueOnce(null);
      const res = await service.restoreEvent(mockContext(), 'event-id');
      expect(res.code).toBe(HttpStatus.NOT_FOUND);
      expect(res.message).toMatch(/Archived Event/i);
    });

    it('restores event and related documents, then deletes archive entries', async () => {
      archives.archiveEventService.findOne.mockResolvedValueOnce({
        _id: 'arch-id',
        originalId: 'event-id',
        name: 'restored-event',
      });
      archives.archiveMatchService.find.mockResolvedValueOnce([{ originalId: 'm1' }]);
      archives.archiveGroupService.find.mockResolvedValueOnce([{ originalId: 'g1' }]);
      archives.archiveSponsorService.find.mockResolvedValueOnce([{ originalId: 's1' }]);
      archives.archiveTemplateService.find.mockResolvedValueOnce([{ originalId: 't1' }]);
      archives.archivePlayerStatsService.find.mockResolvedValueOnce([{ originalId: 'ps1' }]);
      archives.archiveNetService.find.mockResolvedValueOnce([{ originalId: 'n1' }]);
      archives.archiveBadgeService.find.mockResolvedValueOnce([{ originalId: 'b1' }]);
      archives.archiveServerReceiverOnNetService.find.mockResolvedValueOnce([{ originalId: 'sr1' }]);
      archives.archiveServerReceiverSinglePlayService.find.mockResolvedValueOnce([{ originalId: 'sp1' }]);

      const res = await service.restoreEvent(mockContext(), 'event-id');

      expect(eventService.create).toHaveBeenCalled();
      expect(archives.archiveEventService.deleteOne).toHaveBeenCalledWith({ _id: 'arch-id' });
      expect(res.success).toBe(true);
      expect(res.code).toBe(HttpStatus.OK);
    });

    it('returns handleError response on exception', async () => {
      archives.archiveEventService.findOne.mockRejectedValueOnce(new Error('boom'));
      const res = await service.restoreEvent(mockContext(), 'event-id');
      expect(res.success).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // updateEventCache (stub)
  // ════════════════════════════════════════════════════════════════
  describe('updateEventCache', () => {
    it('logs error when event not found (throws internally)', async () => {
      eventService.findOne.mockResolvedValueOnce(null);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await service.updateEventCache('no-event');
      expect(spy).toHaveBeenCalled();
      expect(res.success).toBe(false);
      spy.mockRestore();
    });

    it('logs error when matches array is empty', async () => {
      eventService.findOne.mockResolvedValueOnce(sampleEventDoc());
      matchService.find.mockResolvedValueOnce([]);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await service.updateEventCache('event-id');
      expect(spy).toHaveBeenCalled();
      expect(res.success).toBe(false);
      spy.mockRestore();
    });

    it('completes without throwing when event and matches exist', async () => {
      eventService.findOne.mockResolvedValueOnce(sampleEventDoc());
      matchService.find.mockResolvedValueOnce([{ _id: 'm1', completed: false }]);
      const res = await service.updateEventCache('event-id');
      expect(res).toBeUndefined();
    });
  });
});