import { HttpStatus, Injectable, UseGuards } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { AppResponse } from 'src/shared/response';
import { UserRole } from 'src/user/user.schema';
import { PlayerStats } from './player-stats.schema';
import { ConfigService } from '@nestjs/config';
import { PlayerStatsService } from './player-stats.service';

@ObjectType()
class PlayerStatsResponse extends AppResponse<PlayerStats[]> {
  @Field((_type) => [PlayerStats], { nullable: true })
  data?: PlayerStats;
}

@ObjectType()
export class PlayersStatsResponse extends AppResponse<PlayerStats[]> {
  @Field((_type) => [PlayerStats], { nullable: true })
  data?: PlayerStats[];
}

@Resolver((_of) => PlayerStats)
export class PlayerStatsResolver {
  
  constructor(
    private configService: ConfigService,
    private playerStatsService: PlayerStatsService,
  ) {}

  @Query((_returns) => PlayerStatsResponse)
  async getPlayerStats(@Args('playerId', { type: () => [String] }) playerId: string) {
    try {
      const playerStatsExist = await this.playerStatsService.findById(playerId.toString())
      if(!playerStatsExist) return AppResponse.notFound("PlayerStats");
      return {
        code: HttpStatus.OK,
        success: true,
        data: playerStatsExist,
      }
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
      }
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
