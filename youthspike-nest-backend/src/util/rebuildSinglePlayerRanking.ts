import { UpdatePlayerRankingInput } from 'src/player-ranking/player-ranking.input';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';

/**
 * Helper: rebuild a single player ranking with all items
 */
async function rebuildSinglePlayerRanking(
  playerRanking: PlayerRanking,
  sortedRankingInput: UpdatePlayerRankingInput[],
  playerIds: Set<string>,
  playerRankingService: PlayerRankingService,
): Promise<void> {
  const rankingDocs: PlayerRankingItem[] = [];

  // Prepare ranking documents
  for (const input of sortedRankingInput) {
    if (!playerIds.has(String(input.player))) {
      const error = new Error(`Player not exist in the team (${input.player})`);
      error.name = 'PlayerNotExist';
      throw error;
    }

    rankingDocs.push({
      player: input.player,
      playerRanking: playerRanking._id,
      rank: input.rank,
    });
  }

  // Create all ranking items at once
  const createdRanks = await playerRankingService.insertManyItems(rankingDocs);

  // Extract all IDs and update player ranking
  const createdIds = createdRanks.map((r: any) => r._id);
  await playerRankingService.updateOne({ _id: playerRanking._id }, { $set: { rankings: createdIds } });
}

export default rebuildSinglePlayerRanking;
