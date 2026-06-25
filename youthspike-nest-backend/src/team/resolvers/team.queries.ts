import { TeamService } from 'src/team/team.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { GroupService } from 'src/group/group.service';

// import { ITeamQueries } from '../resolvers/event.types';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { playerKey, tokenToUser } from 'src/utils/helper';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerService } from 'src/player/player.service';
import { CustomPlayerStats } from 'src/player-stats/resolvers/player-stats.response';
import { Net } from 'src/net/net.schema';
import { PlayerStatsEntry } from 'src/event/resolvers/event.response';
import { TeamSearchFilter } from './team.input';
import { RedisService } from 'src/redis/redis.service';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { QueryFilter } from 'mongoose';
import { Team } from '../team.schema';
import { MatchService } from 'src/match/match.service';
import { Match } from 'src/match/match.schema';
import { CustomMatch, CustomNet, CustomRound, GetTeamSearchResponse, GetTeamRosterResponse, GetTeamMatchesResponse, GetPlayerStatsResponse, CustomTeam } from './team.response';
import { CustomEvent } from 'src/event/resolvers/event.response';
import { CustomGroup } from 'src/match/resolvers/match.response';
import { CustomPlayer, CustomPlayerRanking, CustomPlayerRankingItem } from 'src/player/resolvers/player.response';
import { LdoService } from 'src/ldo/ldo.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user/user.schema';
import { EPlayerStatus } from 'src/player/player.schema';
import { PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';

// ITeamQueries

@Injectable()
export class TeamQueries {
  constructor(
    private playerStatsService: PlayerStatsService,
    private eventService: EventService,
    private teamService: TeamService,
    private redisService: RedisService,
    private matchService: MatchService,
    private roundService: RoundService,
    private netService: NetService,
    private groupService: GroupService,
    private playerRankingService: PlayerRankingService,
    private playerService: PlayerService,
    private ldoService: LdoService,
    private userService: UserService,
    private configService: ConfigService,
  ) { }


  async getTeams(eventIds?: string[], limit = 30, offset = 0) {
    try {
      let query: QueryFilter<Team> = {};

      if (eventIds?.length) {
        query = { events: { $in: eventIds } };
      }

      // temp
      // const tempLimit = 5000;
      const teams = await this.teamService.find(query, offset, limit);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of teams!',
        data: teams,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  async getEventWithTeams(eventId: string) {
    try {
      const [eventExist, teams, groups, players] = await Promise.all([
        this.eventService.findById(eventId),
        this.teamService.find({ events: eventId }),
        this.groupService.find({ event: eventId }),
        this.playerService.find({ events: eventId }),
      ]);


      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of teams!',
        data: {
          event: eventExist,
          teams,
          groups,
          players, // already updated
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getTeam(teamId: string) {
    try {
      const teamExist = await this.teamService.findById(teamId);
      // getPlayer Rankings
      if (!teamExist) return AppResponse.notFound('Team');

      const lockPromises = [];
      for (const event of teamExist.events as string[]) {
        lockPromises.push(this.playerRankingService.lockPlayerRanking(teamId, event))
      }

      const ensureLock = await Promise.all(lockPromises);

      return {
        code: HttpStatus.OK,
        success: true,
        data: teamExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getStatsOfPlayers(teamId: string): Promise<GetPlayerStatsResponse> {
    try {
      const team = await this.teamService.findById(teamId);
      const matchQuery: QueryFilter<Match> = {
        $or: [{ teamA: team._id }, { teamB: team._id }],
        includeStats: true
      };
      if (team.groups && team.groups.length > 0) {
        // Not equal
        matchQuery.group = { $ne: null };
      }
      const [players, matches, events] = await Promise.all([
        this.playerService.find({ events: { $in: team.events }, teams: { $in: [team._id] } }),
        this.matchService.find(matchQuery),
        this.eventService.find({ _id: { $in: team.events as string[] } }),
      ]);


      // Using set to remove duplicates
      const matchIds = new Set<string>();
      const oponentIds = new Set<string>();

      for (const m of matches) {
        matchIds.add(String(m._id));
        if (String(m.teamA) !== String(team._id)) {
          oponentIds.add(String(m.teamA));
        } else if (String(m.teamB) !== String(team._id)) {
          oponentIds.add(String(m.teamB));
        }
      }

      // Attributes of matches
      const [rounds, nets, oponents] = await Promise.all([
        this.roundService.find({ match: { $in: [...matchIds] } }),
        this.netService.find({ match: { $in: [...matchIds] } }),
        this.teamService.find({ _id: { $in: [...oponentIds] } })
      ]);
      // All player stats
      const playerToNets: Record<string, Net[]> = {};
      for (const net of nets) {
        [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB].forEach((pid) => {
          if (!pid) return;
          if (!playerToNets[pid]) playerToNets[pid] = [];
          playerToNets[pid].push(net);
        });
      }

      const statsOfPlayer: Record<string, CustomPlayerStats[]> = {};

      // Process players in parallel
      await Promise.all(
        players.map(async (player) => {
          if (!player?._id) return;
          // Create new username for the player if there is no username
          if (!player.username) {
            const username = this.playerService.playerUsername(player.firstName);
            await this.playerService.updateOne({ _id: player._id }, { username });
            player.username = username;
          }

          const netsOfPlayer = playerToNets[player._id] || [];

          // Batch Redis queries
          const redisKeys = netsOfPlayer.map((net) => playerKey(player._id, net._id));
          const redisResults = await Promise.all(redisKeys.map((key) => this.redisService.get(key)));

          const playerstatsRedis = (redisResults as CustomPlayerStats[]).filter(Boolean) as CustomPlayerStats[];
          const redisNetIds = new Set(playerstatsRedis.map((ps) => ps.net));

          // Query DB once, filter in DB if possible
          const playerstatsDB = await this.playerStatsService.find({ player: player._id });

          const mergedStats: CustomPlayerStats[] = [
            ...playerstatsRedis, // Redis stats already prepared
          ];

          // Single efficient loop for DB stats
          for (const ps of playerstatsDB) {
            const plain = { ...ps };

            const netId = String(plain.net);

            // Skip if redis already has this net ID
            if (redisNetIds.has(netId)) continue;
            if (!matchIds.has(String(plain.match))) continue;

            mergedStats.push({
              ...plain,
              net: netId,
              player: String(plain.player),
              match: String(plain.match),
            } as CustomPlayerStats);
          }

          statsOfPlayer[player._id] = mergedStats;
        }),
      );

      const statsArray: PlayerStatsEntry[] = Object.entries(statsOfPlayer).map(([playerId, stats]) => ({
        playerId,
        stats,
      }));

      // team, players, rankings, statsOfPlayer
      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          events: events as CustomEvent[],
          team: team as CustomTeam,
          nets: nets as CustomNet[],
          oponents: oponents as CustomTeam[],
          rounds: rounds as CustomRound[],
          players: players as CustomPlayer[],
          matches: matches as CustomMatch[],
          statsOfPlayers: statsArray,
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  async getTeamRoster(teamId: string): Promise<GetTeamRosterResponse> {
    try {
      const team = await this.teamService.findById(teamId);
      if (!team) return AppResponse.notFound("Team");
      let [players, playerRanking, events, unassignedPlayers] = await Promise.all([
        this.playerService.find({ events: { $in: team.events }, teams: { $in: [team._id] } }),
        this.playerRankingService.findOne({
          team: teamId,
          $or: [
            { match: { $exists: false } }, // `match` is undefined
            { match: null }, // `match` is null
          ],
        }),
        this.eventService.find({ _id: { $in: team.events as string[] } }),

        // Get all unassigned players
        this.playerService.find({
          events: { $in: team.events }, $or: [
            { teams: { $exists: false } },
            { teams: { $size: 0 } }
          ],
          status: EPlayerStatus.ACTIVE,
          division: team.division
        }, 100, 0),
      ]);


      if (!playerRanking || !playerRanking?.rankings || playerRanking.rankings.length === 0) {
        // Create player ranking again, somehow it is not created
        if (!playerRanking) {

          playerRanking = await this.playerRankingService.create({ rankings: [], rankLock: false, team: teamId });
          // Create both
          let rank = 1;
          const rankings = [];
          for (const player of players) {
            if (player.status === EPlayerStatus.INACTIVE) continue;
            const ranking: PlayerRankingItem = { player: player._id, playerRanking: playerRanking._id, rank: rank };
            rankings.push(ranking);
            rank += 1;
          }
          const createdRankings = await this.playerRankingService.insertManyItems(rankings);

          await this.playerRankingService.updateOne({ _id: playerRanking._id }, { $addToSet: { rankings: { $each: createdRankings.map((ranking) => ranking._id) } } });

        } else {
          // Creating only rankings
          let rank = 1;
          const rankings = [];
          for (const player of players) {
            if (player.status === EPlayerStatus.INACTIVE) continue;
            const ranking: PlayerRankingItem = { player: player._id, playerRanking: playerRanking._id, rank: rank };
            rankings.push(ranking);
            rank += 1;
          }
          const createdRankings = await this.playerRankingService.insertManyItems(rankings);

          await this.playerRankingService.updateOne({ _id: playerRanking._id }, { $addToSet: { rankings: { $each: createdRankings.map((ranking) => ranking._id) } } });
          playerRanking = await this.playerRankingService.findOne({ _id: playerRanking._id });

        }

      }

      const playerList = [];

      // Create username if there are not any for a player
      const usernamePromises = [];
      for (let i = 0; i < players.length; i += 1) {
        const player = { ...players[i] };
        if (!player?.username) {
          const username = this.playerService.playerUsername(player.firstName);
          usernamePromises.push(this.playerService.updateOne({ _id: player._id }, { $set: { username } }));
          player.username = username;
        }
        playerList.push(player);
      }


      // Attributes of matches
      const [rankings, ...updatePlayers] = await Promise.all([
        this.playerRankingService.findItems({ playerRanking: playerRanking._id }),
        ...usernamePromises
      ]);

      const eventList = this.eventService.sanitizeEvents(events as CustomEvent[]);

      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          events: eventList as CustomEvent[],
          team: team as CustomTeam,
          players: playerList as CustomPlayer[],
          playerRanking: playerRanking as CustomPlayerRanking,
          rankings: rankings as CustomPlayerRankingItem[],
          unassignedPlayers: unassignedPlayers as CustomPlayer[],
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }



  async getTeamMatches(teamId: string): Promise<GetTeamMatchesResponse> {
    try {
      const team = await this.teamService.findById(teamId);
      const [events, matches] = await Promise.all([
        this.eventService.find({ _id: { $in: team.events as string[] } }),
        this.matchService.find({
          $or: [{ teamA: team._id.toString() }, { teamB: team._id.toString() }],
        }),
      ]);

      // Attributes of matches
      const matchIds = matches.map((m) => m._id);
      const [teams, rounds, nets] = await Promise.all([
        this.teamService.find({ matches: { $in: matchIds } }),
        this.roundService.find({ match: { $in: matchIds } }),
        this.netService.find({ match: { $in: matchIds } }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          team: team as CustomTeam,
          oponents: teams as CustomTeam[],
          events: events as CustomEvent[],
          matches: matches as CustomMatch[],
          rounds: rounds as CustomRound[],
          nets: nets as CustomNet[]
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getTeamWithGroupsAndUnassignedPlayers(
    context: any,
    teamId: string,
    ldoId: string
  ) {
    try {

      const team = await this.teamService.findOne({ _id: teamId });
      if (!team) return AppResponse.notFound("Team");


      const secret = this.configService.get<string>('JWT_SECRET');

      // Decode token
      const userPayload = tokenToUser(context, secret);

      if (!userPayload?._id) {
        return AppResponse.unauthorized();
      }

      // Only fetch fields we actually need
      const loggedUser = await this.userService.findOne(
        { _id: userPayload._id }
      );

      if (!loggedUser) {
        return AppResponse.unauthorized();
      }



      let events = [];


      /**
       * CASE 1:
       * Explicit eventIds provided
       */
      if (ldoId && loggedUser.role === UserRole.admin) {
        const ldo = await this.ldoService.findByDirectorId(ldoId);

        if (ldo?.events?.length) {
          events = await this.eventService.find({
            _id: { $in: ldo.events as string[] },
          });
        }
      }

      /**
       * CASE 2:
       * Director requesting own events
       */
      else if (loggedUser.role === UserRole.director) {
        const ldo = await this.ldoService.findOne({
          director: loggedUser._id,
        });

        if (ldo?.events?.length) {
          events = await this.eventService.find({
            _id: { $in: ldo.events as string[] },
          });
        }
      }

      const resolvedEventIds = events.map((event) => event._id);



      const [groups, players] = await Promise.all([
        this.groupService.find({ event: { $in: resolvedEventIds } }),
        this.playerService.find({ events: { $in: resolvedEventIds }, $or: [{ teams: { $size: 0 } }, { teams: { $exists: false } }, { teams: null }] }),
      ]);


      // Get all events of events
      return {
        code: HttpStatus.OK,
        success: true,
        message: "Getting event and team details",
        data: { events, groups, players, team }
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
  async searchTeams(
    eventIds: string[] | undefined,
    filter: TeamSearchFilter
  ): Promise<GetTeamSearchResponse> {
    try {
      // 🔹 Build query safely
      const teamQuery: QueryFilter<Team> = {};

      if (eventIds?.length) {
        teamQuery.events = { $in: eventIds };
      }

      if (filter?.division) {
        teamQuery.division = { $regex: filter.division, $options: 'i' };
      }

      if (filter?.group) {
        teamQuery.groups = filter.group;
      }

      if (filter?.search) {
        teamQuery.name = { $regex: filter.search, $options: 'i' };
      }

      // 🔹 Pagination
      const offset = filter?.offset ?? 0;
      const limit = filter?.limit ?? 30;

      const teams = await this.teamService.find(teamQuery, offset, limit);

      // 🔹 Extract IDs (optimized loop)
      const matchIdSet = new Set<string>();
      const captainIdSet = new Set<string>();
      const eventIdTeamsSet = new Set<string>();

      for (const team of teams) {
        team.matches?.forEach(m => matchIdSet.add(String(m)));
        if (team.captain) captainIdSet.add(String(team.captain));
        team.events.forEach((t) => eventIdTeamsSet.add(String(t)));
      }

      const matchIds = Array.from(matchIdSet);
      const captainIds = Array.from(captainIdSet);

      // 🔹 Conditional queries (avoid empty DB hits)
      const [matches, nets, rounds, captains, events, groups] = await Promise.all([
        matchIds.length
          ? this.matchService.find({ _id: { $in: matchIds } })
          : [],
        matchIds.length
          ? this.netService.find({ match: { $in: matchIds } })
          : [],
        matchIds.length
          ? this.roundService.find({ match: { $in: matchIds } })
          : [],
        captainIds.length
          ? this.playerService.find({ _id: { $in: captainIds } })
          : [],

        // temp
        // FOr now let's get all events
        // eventIds?.length
        //   ? this.eventService.find({ _id: { $in: eventIds } })
        //   : this.eventService.find({ _id: { $in: [...eventIdTeamsSet] } }),
        this.eventService.find({}),
        eventIds?.length
          ? this.groupService.find({ event: { $in: eventIds } })
          : this.groupService.find({ event: { $in: [...eventIdTeamsSet] } }),
      ]);


      // Make sure groups is not null and there are no null values in groups array


      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          events: events as CustomEvent[],
          teams: this.teamService.normalizeTeams(teams as CustomTeam[]) as CustomTeam[],
          groups: groups as CustomGroup[],
          nets: nets as CustomNet[],
          rounds: rounds as CustomRound[],
          matches: matches as CustomMatch[],
          captains: captains as CustomPlayer[],
        },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

}
