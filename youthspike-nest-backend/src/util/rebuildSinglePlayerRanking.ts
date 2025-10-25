
import { UpdatePlayerRankingInput } from 'src/player-ranking/player-ranking.input';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';

/**
 * Helper: rebuild a single player ranking with all valid players.
 * - Keeps ranks sequential (1, 2, 3, ...)
 * - Ignores players not in playerIds
 * - Includes all playerIds, even if not in sortedRankingInput
 */
async function rebuildSinglePlayerRanking(
  playerRanking: PlayerRanking,
  sortedRankingInput: UpdatePlayerRankingInput[],
  playerIds: Set<string>,
  playerRankingService: PlayerRankingService,
): Promise<void> {
  

  const rankingDocs: PlayerRankingItem[] = [];

  // Filter only valid players from sortedRankingInput (must exist in playerIds)
  const validSortedPlayers = sortedRankingInput
    .filter((r) => playerIds.has(String(r.player)))
    .map((r) => String(r.player));

  // Track already ranked players
  const rankedSet = new Set(validSortedPlayers);

  // Add remaining players (not in sortedRankingInput)
  const remainingPlayers = Array.from(playerIds).filter((id) => !rankedSet.has(id));

  // Combine: ranked first (in given order), then remaining
  const finalOrder = [...validSortedPlayers, ...remainingPlayers];

  // Assign ranks sequentially (1, 2, 3, 4, ...)
  finalOrder.forEach((playerId, index) => {
    rankingDocs.push({
      player: playerId,
      playerRanking: playerRanking._id,
      rank: index + 1,
    });
  });

  // Insert all ranking items at once
  const createdRanks = await playerRankingService.insertManyItems(rankingDocs);

  // Update the parent PlayerRanking document
  const createdIds = createdRanks.map((r: any) => r._id);
  await playerRankingService.updateOne(
    { _id: playerRanking._id },
    { $set: { rankings: createdIds } },
  );
}

export default rebuildSinglePlayerRanking;
