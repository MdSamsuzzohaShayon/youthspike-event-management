// ════════════════════════════════════════════════════════════════
// BREAK CIRCULAR DEPENDENCY:
// event.schema.ts line 104 accesses LDO.name, but LDO is undefined
// due to circular imports. This mock prevents event.schema.ts from
// being evaluated at all. mockEventSchema provides class stubs with
// valid .name properties (non-null strings).
// ════════════════════════════════════════════════════════════════
import { mockEventSchema } from '../../../test/mocks/schema.mock';

jest.mock('../event.schema', () => mockEventSchema);

// All real imports go AFTER jest.mock (Jest hoists jest.mock anyway)
import { Test, TestingModule } from '@nestjs/testing';
import { EventFields } from './event.fields';
import { LdoService } from 'src/ldo/ldo.service';
import { TeamService } from 'src/team/team.service';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { GroupService } from 'src/group/group.service';
import {
  mockLdoService,
  mockTeamService,
  mockSponsorService,
  mockPlayerService,
  mockMatchService,
  mockGroupService,
} from '../../../test/mocks/services.mock';
import { sampleEventDoc } from '../../../test/fixtures/event.fixture';

describe('EventFields', () => {
  let fields: EventFields;
  let ldoService: ReturnType<typeof mockLdoService>;
  let teamService: ReturnType<typeof mockTeamService>;
  let sponsorService: ReturnType<typeof mockSponsorService>;
  let playerService: ReturnType<typeof mockPlayerService>;
  let matchService: ReturnType<typeof mockMatchService>;
  let groupService: ReturnType<typeof mockGroupService>;

  beforeEach(async () => {
    ldoService = mockLdoService();
    teamService = mockTeamService();
    sponsorService = mockSponsorService();
    playerService = mockPlayerService();
    matchService = mockMatchService();
    groupService = mockGroupService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventFields,
        { provide: LdoService, useValue: ldoService },
        { provide: TeamService, useValue: teamService },
        { provide: SponsorService, useValue: sponsorService },
        { provide: PlayerService, useValue: playerService },
        { provide: MatchService, useValue: matchService },
        { provide: GroupService, useValue: groupService },
      ],
    }).compile();

    fields = module.get(EventFields);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── ldo ───────────────────────────────────────────────────
  describe('ldo', () => {
    it('calls ldoService.findByDirectorId with event.ldo as string', async () => {
      const event = sampleEventDoc();
      ldoService.findByDirectorId.mockResolvedValueOnce({
        _id: 'ldo-1',
        name: 'LDO',
      });

      const result = await fields.ldo(event as any);

      expect(ldoService.findByDirectorId).toHaveBeenCalledWith(event.ldo);
      expect(result).toEqual({ _id: 'ldo-1', name: 'LDO' });
    });
  });

  // ─── teams ─────────────────────────────────────────────────
  describe('teams', () => {
    it('calls teamService.find with { events: event._id }', async () => {
      const event = sampleEventDoc();
      const mockTeams = [{ _id: 't1', name: 'Team A' }];
      teamService.find.mockResolvedValueOnce(mockTeams);

      const result = await fields.teams(event as any);

      expect(teamService.find).toHaveBeenCalledWith({ events: event._id });
      expect(result).toEqual(mockTeams);
    });

    it('re-throws when teamService.find throws', async () => {
      const event = sampleEventDoc();
      teamService.find.mockRejectedValueOnce(new Error('DB down'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(fields.teams(event as any)).rejects.toThrow('DB down');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ─── groups ────────────────────────────────────────────────
  describe('groups', () => {
    it('calls groupService.find with { event: event._id }', async () => {
      const event = sampleEventDoc();
      const mockGroups = [{ _id: 'g1', name: 'Group A' }];
      groupService.find.mockResolvedValueOnce(mockGroups);

      const result = await fields.groups(event as any);

      expect(groupService.find).toHaveBeenCalledWith({ event: event._id });
      expect(result).toEqual(mockGroups);
    });

    it('throws "Failed to fetch event groups" when groupService.find throws', async () => {
      const event = sampleEventDoc();
      groupService.find.mockRejectedValueOnce(new Error('DB down'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        fields.groups(event as any),
      ).rejects.toThrow('Failed to fetch event groups');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ─── sponsors ─────────────────────────────────────────────
  describe('sponsors', () => {
    it('calls sponsorService.find with _id $in sponsors array', async () => {
      const event = sampleEventDoc({ sponsors: ['s1', 's2'] });
      const mockSponsors = [{ _id: 's1' }, { _id: 's2' }];
      sponsorService.find.mockResolvedValueOnce(mockSponsors);

      const result = await fields.sponsors(event as any);

      expect(sponsorService.find).toHaveBeenCalledWith({
        _id: { $in: ['s1', 's2'] },
      });
      expect(result).toEqual(mockSponsors);
    });

    it('handles empty sponsors array', async () => {
      const event = sampleEventDoc({ sponsors: [] });
      sponsorService.find.mockResolvedValueOnce([]);

      const result = await fields.sponsors(event as any);

      expect(sponsorService.find).toHaveBeenCalledWith({
        _id: { $in: [] },
      });
      expect(result).toEqual([]);
    });
  });

  // ─── players ──────────────────────────────────────────────
  describe('players', () => {
    it('calls playerService.find with _id $in players array', async () => {
      const event = sampleEventDoc({ players: ['p1', 'p2'] });
      const mockPlayers = [{ _id: 'p1' }, { _id: 'p2' }];
      playerService.find.mockResolvedValueOnce(mockPlayers);

      const result = await fields.players(event as any);

      expect(playerService.find).toHaveBeenCalledWith({
        _id: { $in: ['p1', 'p2'] },
      });
      expect(result).toEqual(mockPlayers);
    });

    it('returns empty array when playerService.find throws', async () => {
      const event = sampleEventDoc({ players: ['p1'] });
      playerService.find.mockRejectedValueOnce(new Error('DB down'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fields.players(event as any);

      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ─── matches ──────────────────────────────────────────────
  describe('matches', () => {
    it('calls matchService.find with _id $in matches array', async () => {
      const event = sampleEventDoc({ matches: ['m1', 'm2'] });
      const mockMatches = [{ _id: 'm1' }, { _id: 'm2' }];
      matchService.find.mockResolvedValueOnce(mockMatches);

      const result = await fields.matches(event as any);

      expect(matchService.find).toHaveBeenCalledWith({
        _id: { $in: ['m1', 'm2'] },
      });
      expect(result).toEqual(mockMatches);
    });

    it('handles empty matches array', async () => {
      const event = sampleEventDoc({ matches: [] });
      matchService.find.mockResolvedValueOnce([]);

      const result = await fields.matches(event as any);

      expect(matchService.find).toHaveBeenCalledWith({
        _id: { $in: [] },
      });
      expect(result).toEqual([]);
    });
  });
});