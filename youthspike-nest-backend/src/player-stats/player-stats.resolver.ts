import { HttpStatus } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { PlayerStats } from './player-stats.schema';
import { ConfigService } from '@nestjs/config';
import { PlayerStatsService } from './player-stats.service';
import { PlayersStatsResponse, PlayerStatsResponse, PlayerWithStatsResponse } from './player-stats.response';
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
    private eventService: EventService
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
  async getPlayerWithStats(@Args('playerId') playerId: string) {
    try {
      // Get a player
      const player = await this.playerService.findById(playerId);
      if (!player) return AppResponse.notFound('Player');
      let team = null,
        matches = null,
        nets = null,
        playerstats = [];

      const eventExist = await this.eventService.findOne({ _id: { $in: player.events } });
      
      const [multiplayer, weight] = await Promise.all([
        this.playerStatsService.proStatFindOne({_id: eventExist.multiplayer}),
        this.playerStatsService.proStatFindOne({_id: eventExist.weight}),
      ]);
      // Get team of the players
      if (player.teams.length > 0) {
        team = await this.teamService.findOne({ _id: { $in: player.teams } });
        if (team) {
          // Get all matches of the player
          matches = await this.matchService.find({ $or: [{ teamA: team._id }, { teamB: team._id }] });

          // Get list of all player stats
          if (matches.length > 0) {
            // Get all nets of the player
            nets = await this.netService.find({
              $or: [
                { teamAPlayerA: playerId },
                { teamAPlayerB: playerId },
                { teamBPlayerA: playerId },
                { teamBPlayerB: playerId },
              ],
            });

            // Find updated player stats from redis
            playerstats = await Promise.all(nets.map((net) => this.redisService.get(playerKey(playerId, net._id)))); // Redis key: <player:id:net>
            playerstats = playerstats.filter((ps) => ps);

            if (!playerstats || playerstats.length === 0) {
              // Check if there is already a record in mongodb or not, if there is a record do not create a new record from scratch
              playerstats = await this.playerStatsService.find({ player: playerId });
              await Promise.all(playerstats.map((ps) => this.redisService.set(playerKey(playerId, ps.net), ps)));
            }
          }
        }
      }
      // player, team, playerstats
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
          weight
        },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
