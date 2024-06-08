import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PlayerRankingItem } from './player-ranking.schema';
import { PlayerService } from 'src/player/player.service';
import { Player } from 'src/player/player.schema';

@Resolver(() => PlayerRankingItem)
export class PlayerRankingItemResolver {
  constructor(private playerService: PlayerService) {}

  @ResolveField(() => Player) // Specify the return type as an array of PlayerRankingItem
  async player(@Parent() pri: PlayerRankingItem): Promise<Player> {
    try {
      const player = await this.playerService.findById(pri.player.toString());
      if (!player || !player.firstName) {
        // Handle the case where player or firstName is null
        throw new Error('Player or Player firstName not found');
      }
      return player;
    } catch (error) {
      console.log(error);
      // Return a default player object or handle the error appropriately
      return null; // or throw an appropriate GraphQL error
    }
  }
}
