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
  ) {}

  async getTeams(eventId: string) {
    try {
      const query: Record<string, any> = {};
      if (eventId) query.event = eventId;
      const teams = await this.teamService.find(query);
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of teams!',
        data: teams,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getEventWithTeams(eventId: string) {
    try {
      const [eventExist, teams, groups, players] = await Promise.all([
        this.eventService.findById(eventId),
        this.teamService.find({ event: eventId }),
        this.groupService.find({ event: eventId }),
        this.playerService.find({ events: eventId }),
      ]);

      /*
      const updatePromises: Promise<any>[] = [];
  
      for (const player of players) {
        if (!player.username) {
          const username = this.playerService.playerUsername(
            player.firstName + '2',
          );
  
          // Update DB
          updatePromises.push(
            this.playerService.updateOne(
              { _id: player._id },
              { $set: { username } },
            ),
          );
  
          // Update in-memory object
          player.username = username;
        }
      }
  
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
        */

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

      const locked = await this.playerRankingService.lockPlayerRanking(teamId, teamExist.event.toString());

      return {
        code: HttpStatus.OK,
        success: true,
        data: teamExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getTeamDetails(teamId: string) {
    try {
      const [team] = await Promise.all([this.teamService.findById(teamId)]);
      const [players, group, captain, cocaptain, event, matches, playerRanking] = await Promise.all([
        // this.playerService.find({ teams: { $in: [team._id] } }),
        this.playerService.find({ events: { $in: [team.event] } }),
        this.groupService.findOne({ _id: team.group }),
        this.playerService.findOne({ _id: team.captain }),
        this.playerService.findOne({ _id: team.cocaptain }),
        this.eventService.findOne({ _id: team.event }),
        this.matchService.find({
          $or: [{ teamA: team._id.toString() }, { teamB: team._id.toString() }],
        }),
        this.playerRankingService.findOne({
          team: teamId,
          $or: [
            { match: { $exists: false } }, // `match` is undefined
            { match: null }, // `match` is null
          ],
        }),
      ]);

      // Attributes of matches
      const matchIds = matches.map((m) => m._id);
      // const oponentTeamIds = [
      //   ...new Set(matches.map((m) => (m.teamA.toString() === teamId ? m.teamB.toString() : m.teamA.toString()))),
      // ];
      const [rounds, nets, teams, rankings] = await Promise.all([
        this.roundService.find({ match: { $in: matchIds } }),
        this.netService.find({ match: { $in: matchIds } }),
        this.teamService.find({ event: team.event }),
        this.playerRankingService.findItems({ playerRanking: playerRanking._id }),
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

          // Convert Mongoose documents to plain objects and filter
          const playerstatsDBPlain = playerstatsDB
            .map((ps) => {
              const plainObj = { ...ps };
              return {
                ...plainObj,
                net: String(plainObj.net),
                player: String(plainObj.player),
                match: String(plainObj.match),
              } as CustomPlayerStats;
            })
            .filter((ps: CustomPlayerStats) => !redisNetIds.has(String(ps.net)));

          // Merge both sources
          statsOfPlayer[player._id] = [...playerstatsRedis, ...playerstatsDBPlain];
        }),
      );

      const statsArray: PlayerStatsEntry[] = Object.entries(statsOfPlayer).map(([playerId, stats]) => ({
        playerId,
        stats,
      }));

      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          team,
          players,
          group,
          captain,
          cocaptain,
          event,
          matches,
          rounds,
          nets,
          teams,
          statsOfPlayer: statsArray,
          playerRanking,
          rankings,
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getTeamRoster(teamId: string) {
    try {
      const team = await this.teamService.findById(teamId);
      const matchQuery: QueryFilter<Match> = {
        // $or: [{ teamA: team._id.toString() }, { teamB: team._id.toString() }],
        includeStats: true
      };
      if (team.group) {
        // matchQuery.group = team.group;
        matchQuery.group = { $ne: null };
      }
      const [players, matches, playerRanking, event] = await Promise.all([
        this.playerService.find({ events: { $in: [team.event] }, teams: { $in: [team._id] } }),
        this.matchService.find(matchQuery),
        this.playerRankingService.findOne({
          team: teamId,
          $or: [
            { match: { $exists: false } }, // `match` is undefined
            { match: null }, // `match` is null
          ],
        }),
        this.eventService.findOne({ _id: team.event }),
      ]);

      const eventId = String(team.event);

      // Attributes of matches
      const matchIds = new Set(matches.map((m) => String(m._id)));
      const [nets, rankings] = await Promise.all([
        this.netService.find({ match: { $in: [...matchIds] } }),
        this.playerRankingService.findItems({ playerRanking: playerRanking._id }),
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
          event,
          team,
          players,
          statsOfPlayer: statsArray,
          playerRanking,
          rankings,
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getTeamMatches(teamId: string) {
    try {
      const team = await this.teamService.findById(teamId);
      const [event, matches] = await Promise.all([
        this.eventService.findOne({ _id: team.event }),
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
          team,
          teams,
          event,
          matches,
          rounds,
          nets,
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getTeamWithGroupsAndUnassignedPlayers(eventId: string, teamId: string){
    try {
      const event = await this.eventService.findOne({_id: eventId});
      if(!event) return AppResponse.notFound("Event");

      // groups
      // players
      const [groups, players, team] = await Promise.all([
        this.groupService.find({ event: eventId }),
        this.playerService.find({ $or: [{ teams: { $size: 0 } }, { teams: { $exists: false } }, { teams: null }] }),
        this.teamService.findOne({_id: teamId})
      ]);
      return {
        code: HttpStatus.OK,
        success: true,
        message: "Getting event and team details",
        data: {event, groups, players, team}
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async searchTeams(eventId: string, filter: TeamSearchFilter) {
    try {
      // event, teams, matches, nets, rounds
      const [event, groups] = await Promise.all([
        this.eventService.findOne({ _id: eventId }),
        this.groupService.find({ event: eventId }),
      ]);

      const teamQuery: QueryFilter<Team> = { event: eventId };
      if (filter?.division) {
        teamQuery.division = { $regex: filter.division, $options: 'i' };
      }

      if (filter?.group) {
        teamQuery.group = filter.group;
      }

      if (filter?.search) {
        teamQuery.name = { $regex: filter.search, $options: 'i' }; // case-insensitive search
      }

      // Default pagination (if missing)
      const offset = filter?.offset ?? 0;
      const limit = filter?.limit ?? 30;

      const teams = await this.teamService.find(teamQuery, offset, limit);

      const matchIds = new Set<string>();
      const captainIds = new Set<string>();
      for (const t of teams) {
        if (t.matches) {
          for (const m of t.matches) {
            matchIds.add(String(m));
          }
        }
        if(t?.captain){
          captainIds.add(String(t.captain));
        }
      }

      const [matches, nets, rounds, captains] = await Promise.all([
        this.matchService.find({ _id: { $in: [...matchIds] } }),
        this.netService.find({ match: { $in: [...matchIds] } }),
        this.roundService.find({ match: { $in: [...matchIds] } }),
        this.playerService.find({_id: {$in: [...captainIds]}})
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          event,
          teams,
          groups,
          nets,
          rounds,
          matches,
          captains
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getTeamStandings(eventId: string) {
    try {
      const [event, groups, matches, teams] = await Promise.all([
        this.eventService.findOne({ _id: eventId }),
        this.groupService.find({ event: eventId }),
        this.matchService.find({ event: eventId }),
        this.teamService.find({ event: eventId }),
      ]);

      const matchIds = matches.map((m) => m._id.toString());
      const [rounds, nets] = await Promise.all([
        this.roundService.find({ match: { $in: matchIds } }),
        this.netService.find({ match: { $in: matchIds } }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        data: { event, groups, matches, teams, rounds, nets },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
}
