import { Args, Query, Resolver } from '@nestjs/graphql';
import { PlayerStats } from './player-stats.schema';
import {
  PlayersStatsResponse,
  PlayerStatsResponse,
  PlayerWithStatsResponse
} from './resolvers/player-stats.response';
import { PlayerStatsQueries } from './resolvers/player-stats.queries';

@Resolver((_of) => PlayerStats)
export class PlayerStatsResolver {
  constructor(private readonly playerStatsQueries: PlayerStatsQueries) {}

  @Query((_returns) => PlayerStatsResponse)
  async getPlayerStats(@Args('playerId', { type: () => [String] }) playerId: string) {
    return this.playerStatsQueries.getPlayerStats(playerId);
  }

  @Query((_returns) => PlayersStatsResponse)
  async getPlayersStats() {
    return this.playerStatsQueries.getPlayersStats();
  }

  @Query((_returns) => PlayerWithStatsResponse)
  async getPlayerWithStats(@Args('playerId') playerId: string, @Args('group', { nullable: true }) group?: boolean) {
    return this.playerStatsQueries.getPlayerWithStats(playerId, group);
  }
}
