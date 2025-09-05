import { HttpStatus } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { PlayerStats } from './player-stats.schema';
import { ConfigService } from '@nestjs/config';
import { PlayerStatsService } from './player-stats.service';
import {
  CustomPlayerStats,
  PlayersStatsResponse,
  PlayerStatsResponse,
  PlayerWithStatsResponse,
} from './player-stats.response';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { NetService } from 'src/net/net.service';
import { playerKey } from 'src/util/helper';
import { RedisService } from 'src/redis/redis.service';
import { EventService } from 'src/event/event.service';

@Resolver((_of) => PlayerStats)
export class PlayerStatsResolver {
  constructor(
    private playerService: PlayerService,
    private teamService: TeamService,
    private matchService: MatchService,
    private netService: NetService,
    private playerStatsService: PlayerStatsService,
    private readonly redisService: RedisService,
    private eventService: EventService,
  ) {}

  @Query((_returns) => PlayerStatsResponse)
  async getPlayerStats(@Args('playerId', { type: () => [String] }) playerId: string) {
    try {
      const playerStatsExist = await this.playerStatsService.findById(playerId.toString());
      if (!playerStatsExist) return AppResponse.notFound('PlayerStats');
      return {
        code: HttpStatus.OK,
        success: true,
        data: playerStatsExist,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  @Query((_returns) => PlayersStatsResponse)
  async getPlayersStats() {
    try {
      const playersStats = await this.playerStatsService.find({});
      return {
        code: HttpStatus.OK,
        success: true,
        data: playersStats,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  @Query((_returns) => PlayerWithStatsResponse)
  @Query((_returns) => PlayerWithStatsResponse)
  async getPlayerWithStats(@Args('playerId') playerId: string) {
    try {
      // Get the player
      const player = await this.playerService.findById(playerId);
      if (!player) return AppResponse.notFound('Player');

      let team = null,
        matches = null,
        nets = null,
        playerstats = [];

      // Get the event the player is participating in
      const eventExist = await this.eventService.findOne({ _id: { $in: player.events } });

      const [multiplayer, weight] = await Promise.all([
        this.playerStatsService.proStatFindOne({ _id: eventExist.multiplayer }),
        this.playerStatsService.proStatFindOne({ _id: eventExist.weight }),
      ]);

      // Get team of the player
      if (player.teams.length > 0) {
        team = await this.teamService.findOne({ players: playerId });

        if (team) {
          // Get all matches of the player's team
          matches = await this.matchService.find({
            $or: [{ teamA: team._id }, { teamB: team._id }],
          });

          if (matches.length > 0) {
            const matchIds = matches.map((m) => m._id.toString());

            // Get all nets from the player's matches
            nets = await this.netService.find({
              match: { $in: matchIds },
              $or: [
                { teamAPlayerA: playerId },
                { teamAPlayerB: playerId },
                { teamBPlayerA: playerId },
                { teamBPlayerB: playerId },
              ],
            });

            // Create player-to-nets mapping (similar to multiple players approach)
            const playerToNets: Record<string, any[]> = {};
            nets.forEach((net) => {
              if (!playerToNets[playerId]) playerToNets[playerId] = [];
              playerToNets[playerId].push(net);
            });

            const netsOfPlayer = playerToNets[playerId] || [];

            // Batch Redis queries
            const redisKeys = netsOfPlayer.map((net) => playerKey(playerId, net._id));
            const redisResults = await Promise.all(redisKeys.map((key) => this.redisService.get(key)));

            const playerstatsRedis = (redisResults as CustomPlayerStats[]).filter(Boolean) as CustomPlayerStats[];
            const redisNetIds = new Set(playerstatsRedis.map((ps) => ps.net));

            // Query DB once, filter in DB if possible
            const playerstatsDB = await this.playerStatsService.find({
              player: playerId,
              net: { $nin: Array.from(redisNetIds) }, // Filter out nets already in Redis
            });

            // Convert Mongoose documents to plain objects
            const playerstatsDBPlain = playerstatsDB.map((ps) => {
              const plainObj = ps.toObject() as any;
              return {
                ...plainObj,
                net: String(plainObj.net),
                player: String(plainObj.player),
                match: String(plainObj.match),
              } as CustomPlayerStats;
            });

            // Merge both sources
            playerstats = [...playerstatsRedis, ...playerstatsDBPlain];

            // If no stats found, create empty records (optional)
            if (playerstats.length === 0) {
              playerstats = netsOfPlayer.map(
                (net) =>
                  ({
                    serveOpportunity: 0,
                    serveAce: 0,
                    serveCompletionCount: 0,
                    servingAceNoTouch: 0,
                    receiverOpportunity: 0,
                    receivedCount: 0,
                    noTouchAcedCount: 0,
                    settingOpportunity: 0,
                    cleanSets: 0,
                    hittingOpportunity: 0,
                    cleanHits: 0,
                    defensiveOpportunity: 0,
                    defensiveConversion: 0,
                    break: 0,
                    broken: 0,
                    matchPlayed: 0,
                    net: net._id.toString(),
                    player: playerId,
                    match: net.match.toString(),
                  } as CustomPlayerStats),
              );
            }
          }
        }
      }

      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          player,
          team,
          playerstats,
          matches,
          nets,
          multiplayer,
          weight,
        },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
