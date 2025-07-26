import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { RoomService } from 'src/room/room.service';
import { RoundService } from 'src/round/round.service';
import { NetService, } from 'src/net/net.service';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { PlayerService } from 'src/player/player.service';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { ServerReceiverOnNetService } from 'src/server-receiver-on-net/server-receiver-on-net.service';

@Injectable()
export class GatewayService {
  constructor(
    private readonly redisService: RedisService,
    private readonly roomService: RoomService,
    private readonly roundService: RoundService,
    private readonly netService: NetService,
    private readonly serverReceiverOnNetService: ServerReceiverOnNetService,
    private readonly playerRankingService: PlayerRankingService,
    private readonly eventService: EventService,
    private readonly teamService: TeamService,
    private readonly matchService: MatchService,
    private readonly playerService: PlayerService,
    private readonly playerStatsService: PlayerStatsService
  ) {}

  getServices() {
    return {
      redisService: this.redisService,
      roomService: this.roomService,
      roundService: this.roundService,
      netService: this.netService,
      serverReceiverOnNetService: this.serverReceiverOnNetService,
      playerRankingService: this.playerRankingService,
      eventService: this.eventService,
      teamService: this.teamService,
      matchService: this.matchService,
      playerService: this.playerService,
      playerStatsService: this.playerStatsService
    };
  }
}