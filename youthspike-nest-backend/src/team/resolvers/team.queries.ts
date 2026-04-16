import { TeamService } from 'src/team/team.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { GroupService } from 'src/group/group.service';

// import { ITeamQueries } from '../resolvers/event.types';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { playerKey } from 'src/utils/helper';
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
import { CustomMatch, CustomNet, CustomRound, GetTeamSearchResponse, GetTeamRosterResponse, GetTeamMatchesResponse, GetPlayerStatsResponse } from './team.response';
import {CustomEvent} from 'src/event/resolvers/event.response';
import { CustomGroup, CustomTeam } from 'src/match/resolvers/match.response';
import { CustomPlayer, CustomPlayerRanking, CustomPlayerRankingItem } from 'src/player/resolvers/player.response';

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
  ) { }


  async getTeams(eventIds?: string[], limit = 30, offset = 0) {
    try {
      let query: QueryFilter<Team> = {};

      if (eventIds?.length) {
        query = { events: { $in: eventIds } };
      }

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
        if(String(m.teamA) !== String(team._id)){
          oponentIds.add(String(m.teamA));
        }else if(String(m.teamB) !== String(team._id)){
          oponentIds.add(String(m.teamB));
        }
      }

      // Attributes of matches
      const [rounds, nets, oponents] = await Promise.all([
        this.roundService.find({ match: { $in: [...matchIds] } }),
        this.netService.find({ match: { $in: [...matchIds] } }),
        this.teamService.find({_id: {$in: [...oponentIds]}})
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
      if(!team) return AppResponse.notFound("Team");
      const [players, playerRanking, events] = await Promise.all([
        this.playerService.find({ events: { $in: team.events }, teams: { $in: [team._id] } }),
        this.playerRankingService.findOne({
          team: teamId,
          $or: [
            { match: { $exists: false } }, // `match` is undefined
            { match: null }, // `match` is null
          ],
        }),
        this.eventService.find({ _id: { $in: team.events as string[] } }),
      ]);


      // Attributes of matches
      const [rankings] = await Promise.all([
        this.playerRankingService.findItems({ playerRanking: playerRanking._id }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          events: events as CustomEvent[],
          team,
          players: players as CustomPlayer[],
          playerRanking: playerRanking as CustomPlayerRanking,
          rankings: rankings as CustomPlayerRankingItem[],
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

  async getTeamWithGroupsAndUnassignedPlayers(eventIds: string[], teamId: string) {
    try {
    const events = await this.eventService.find({ _id: {$in: eventIds} });
      if (!events) return AppResponse.notFound("Event");


      const [groups, players, team] = await Promise.all([
        this.groupService.find({ event: {$in: eventIds} }),
        this.playerService.find({ events: {$in: eventIds}, $or: [{ teams: { $size: 0 } }, { teams: { $exists: false } }, { teams: null }] }),
        this.teamService.findOne({ _id: teamId })
      ]);
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
        team.events.forEach((t)=> eventIdTeamsSet.add(String(t)));
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
        eventIds?.length
          ? this.eventService.find({ _id: { $in: eventIds } })
          : this.eventService.find({ _id: { $in: [...eventIdTeamsSet] } }),
        eventIds?.length
          ? this.groupService.find({ event: { $in: eventIds } })
          : this.groupService.find({ event: { $in: [...eventIdTeamsSet] } }),
      ]);
  
      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          events: events as CustomEvent[],
          teams: teams as CustomTeam[],
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
