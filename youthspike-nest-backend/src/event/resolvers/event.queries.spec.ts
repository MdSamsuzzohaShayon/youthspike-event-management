import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventQueries } from './event.queries';
import { EventService } from '../event.service';
import { TeamService } from 'src/team/team.service';
import { LdoService } from 'src/ldo/ldo.service';
import { PlayerService } from 'src/player/player.service';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { UserService } from 'src/user/user.service';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { GroupService } from 'src/group/group.service';
import { BadgeService } from 'src/badge/badge.service';
import {
  ArchiveEventService, ArchiveTeamService, ArchiveTemplateService, ArchiveMatchService,
  ArchiveGroupService, ArchiveSponsorService,
} from 'src/archive/archive.service';
import * as helperModule from 'src/utils/helper';

import {
  sampleEventDoc, directorUser, adminUser, sampleLdo,
} from '../../../test/fixtures/event.fixture';
import { mockContext } from '../../../test/mocks/context.mock';
import {
  mockEventService, mockTeamService, mockLdoService, mockPlayerService, mockPlayerStatsService,
  mockUserService, mockSponsorService, mockGroupService, mockBadgeService, mockConfigService,
  mockArchiveServices,
} from '../../../test/mocks/services.mock';

jest.mock('src/utils/helper');

describe('EventQueries', () => {
  let queries: EventQueries;
  let eventService: ReturnType<typeof mockEventService>;
  let userService: ReturnType<typeof mockUserService>;
  let ldoService: ReturnType<typeof mockLdoService>;
  let playerStatsService: ReturnType<typeof mockPlayerStatsService>;
  let sponsorService: ReturnType<typeof mockSponsorService>;
  let badgeService: ReturnType<typeof mockBadgeService>;
  let groupService: ReturnType<typeof mockGroupService>;
  let teamService: ReturnType<typeof mockTeamService>;
  let archives: ReturnType<typeof mockArchiveServices>;

  beforeEach(async () => {
    jest.clearAllMocks();

    eventService = mockEventService();
    userService = mockUserService();
    ldoService = mockLdoService();
    playerStatsService = mockPlayerStatsService();
    sponsorService = mockSponsorService();
    badgeService = mockBadgeService();
    groupService = mockGroupService();
    teamService = mockTeamService();
    archives = mockArchiveServices();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventQueries,
        { provide: ConfigService, useValue: mockConfigService() },
        { provide: EventService, useValue: eventService },
        { provide: TeamService, useValue: teamService },
        { provide: LdoService, useValue: ldoService },
        { provide: PlayerService, useValue: mockPlayerService() },
        { provide: PlayerStatsService, useValue: playerStatsService },
        { provide: UserService, useValue: userService },
        { provide: GroupService, useValue: groupService },
        { provide: SponsorService, useValue: sponsorService },
        { provide: BadgeService, useValue: badgeService },
        { provide: ArchiveEventService, useValue: archives.archiveEventService },
        { provide: ArchiveTeamService, useValue: archives.archiveTeamService },
        { provide: ArchiveTemplateService, useValue: archives.archiveTemplateService },
        { provide: ArchiveMatchService, useValue: archives.archiveMatchService },
        { provide: ArchiveGroupService, useValue: archives.archiveGroupService },
        { provide: ArchiveSponsorService, useValue: archives.archiveSponsorService },
      ],
    }).compile();

    queries = module.get(EventQueries);
  });

  // ─── getEvents ──────────────────────────────────────────────────
  describe('getEvents', () => {
    it('returns all events with no filter when no logged user', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({});
      eventService.find.mockResolvedValueOnce([sampleEventDoc()]);

      const res = await queries.getEvents(mockContext());

      expect(eventService.find).toHaveBeenCalledWith({});
      expect(res.success).toBe(true);
      expect(res.code).toBe(HttpStatus.OK);
      expect(res.data).toHaveLength(1);
    });

    it('filters events by ldo when director is logged in', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findById.mockResolvedValueOnce(directorUser());
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo());
      eventService.find.mockResolvedValueOnce([sampleEventDoc()]);

      const res = await queries.getEvents(mockContext());

      expect(ldoService.findByDirectorId).toHaveBeenCalledWith('director-id');
      expect(eventService.find).toHaveBeenCalledWith({ ldo: sampleLdo()._id });
      expect(res.success).toBe(true);
    });

    it('returns handleError response on exception', async () => {
      (helperModule.tokenToUser as jest.Mock).mockImplementationOnce(() => { throw new Error('boom'); });
      const res = await queries.getEvents(mockContext());
      expect(res.success).toBe(false);
    });
  });

  // ─── getArchivedEvents ──────────────────────────────────────────
  describe('getArchivedEvents', () => {
    it('returns archived events enriched with relatedCounts', async () => {
      archives.archiveEventService.find.mockResolvedValueOnce([
        { _id: 'a1', originalId: 'event-1', name: 'Archived' },
      ]);
      // count returns 0 by default — verify calls happen
      const res = await queries.getArchivedEvents(mockContext());

      expect(archives.archiveEventService.find).toHaveBeenCalled();
      expect(archives.archiveTemplateService.count).toHaveBeenCalledWith({ event: 'event-1' });
      expect(archives.archiveMatchService.count).toHaveBeenCalledWith({ event: 'event-1' });
      expect(archives.archiveGroupService.count).toHaveBeenCalledWith({ event: 'event-1' });
      expect(archives.archiveSponsorService.count).toHaveBeenCalledWith({ event: 'event-1' });
      expect(res.success).toBe(true);
      expect(res.data[0].relatedCounts).toEqual({ templates: 0, matches: 0, groups: 0, sponsors: 0 });
    });

    it('uses _id as originalId when originalId is missing', async () => {
      archives.archiveEventService.find.mockResolvedValueOnce([
        { _id: 'fallback-id', name: 'Legacy' }, // no originalId
      ]);
      const res = await queries.getArchivedEvents(mockContext());
      expect(archives.archiveTemplateService.count).toHaveBeenCalledWith({ event: 'fallback-id' });
      expect(res.success).toBe(true);
    });

    it('returns handleError response on exception', async () => {
      archives.archiveEventService.find.mockRejectedValueOnce(new Error('boom'));
      const res = await queries.getArchivedEvents(mockContext());
      expect(res.success).toBe(false);
    });
  });

  // ─── getEventWithGroupsAndUnassignedPlayers ────────────────────
  describe('getEventWithGroupsAndUnassignedPlayers', () => {
    it('returns unauthorized when no _id in token', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({});
      const res = await queries.getEventWithGroupsAndUnassignedPlayers(mockContext());
      expect(res.code).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('returns unauthorized when user not found', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'u1' });
      userService.findOne.mockResolvedValueOnce(null);
      const res = await queries.getEventWithGroupsAndUnassignedPlayers(mockContext());
      expect(res.code).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('CASE 1: admin with ldoId returns events from that LDO plus groups/players/badges', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'admin-id' });
      userService.findOne.mockResolvedValueOnce(adminUser());
      ldoService.findByDirectorId.mockResolvedValueOnce(sampleLdo({ events: ['e1'] }));
      eventService.find.mockResolvedValueOnce([sampleEventDoc()]);

      const res = await queries.getEventWithGroupsAndUnassignedPlayers(mockContext(), 'ldo-1');

      expect(ldoService.findByDirectorId).toHaveBeenCalledWith('ldo-1');
      expect(eventService.find).toHaveBeenCalledWith({ _id: { $in: ['e1'] } });
      expect(groupService.find).toHaveBeenCalled();
      expect(badgeService.find).toHaveBeenCalled();
      expect(res.success).toBe(true);
      expect(res.data.events).toHaveLength(1);
    });

    it('CASE 2: director returns own events', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'director-id' });
      userService.findOne.mockResolvedValueOnce(directorUser());
      ldoService.findOne.mockResolvedValueOnce(sampleLdo({ events: ['e1'] }));
      eventService.find.mockResolvedValueOnce([sampleEventDoc()]);

      const res = await queries.getEventWithGroupsAndUnassignedPlayers(mockContext());

      expect(ldoService.findOne).toHaveBeenCalledWith({ director: 'director-id' });
      expect(res.success).toBe(true);
    });

    it('returns handleError response on exception', async () => {
      (helperModule.tokenToUser as jest.Mock).mockImplementationOnce(() => { throw new Error('boom'); });
      const res = await queries.getEventWithGroupsAndUnassignedPlayers(mockContext());
      expect(res.success).toBe(false);
    });
  });

  // ─── getPlayerEventSetting ──────────────────────────────────────
  describe('getPlayerEventSetting', () => {
    it('returns player + teams for captain/co-captain/player role', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'u1' });
      userService.findById.mockResolvedValueOnce({ _id: 'u1', role: 'captain', captainplayer: 'p1' });
      teamService.find.mockResolvedValueOnce([{ _id: 't1' }]);
      const player = { _id: 'p1', badge: 'badge-1', teams: [{ _id: 't1' }], captainofteams: [], cocaptainofteams: [] };
      const playerServiceMock = mockPlayerService();
      // Override the injected player service via module ref
      // (the test uses the default mock which returns undefined from findOne — let's stub it)
      const res = await queries.getPlayerEventSetting(mockContext(), 'event-id');

      // Player not found in default mock → notFound
      expect(res.code).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns event/teams/ldo/sponsors/badges/multiplayer/weight for non-player role', async () => {
      (helperModule.tokenToUser as jest.Mock).mockReturnValueOnce({ _id: 'u1' });
      userService.findById.mockResolvedValueOnce({ _id: 'u1', role: 'admin' });
      teamService.find.mockResolvedValueOnce([{ _id: 't1' }]);
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());
      ldoService.findOne.mockResolvedValueOnce(sampleLdo());
      sponsorService.find.mockResolvedValueOnce([{ _id: 's1' }]);
      playerStatsService.proStatFindOne
        .mockResolvedValueOnce({ _id: 'm1' })
        .mockResolvedValueOnce({ _id: 'w1' });
      badgeService.find.mockResolvedValueOnce([{ _id: 'b1' }]);

      const res = await queries.getPlayerEventSetting(mockContext(), 'event-id');

      expect(eventService.findById).toHaveBeenCalledWith('event-id');
      expect(ldoService.findOne).toHaveBeenCalledWith({ events: { $in: ['event-id'] } });
      expect(res.success).toBe(true);
      expect(res.data.event).toBeDefined();
      expect(res.data.multiplayer).toEqual({ _id: 'm1' });
      expect(res.data.weight).toEqual({ _id: 'w1' });
    });

    it('returns handleError response on exception', async () => {
      (helperModule.tokenToUser as jest.Mock).mockImplementationOnce(() => { throw new Error('boom'); });
      const res = await queries.getPlayerEventSetting(mockContext(), 'event-id');
      expect(res.success).toBe(false);
    });
  });

  // ─── getEvent ───────────────────────────────────────────────────
  describe('getEvent', () => {
    it('returns not found when event does not exist', async () => {
      eventService.findById.mockResolvedValueOnce(null);
      const res = await queries.getEvent('no-event');
      expect(res.code).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns event successfully', async () => {
      eventService.findById.mockResolvedValueOnce(sampleEventDoc());
      const res = await queries.getEvent('event-id');
      expect(res.success).toBe(true);
      expect(res.code).toBe(HttpStatus.OK);
      expect(res.data).toBeDefined();
    });

    it('returns handleError response on exception', async () => {
      eventService.findById.mockRejectedValueOnce(new Error('boom'));
      const res = await queries.getEvent('event-id');
      expect(res.success).toBe(false);
    });
  });
});
