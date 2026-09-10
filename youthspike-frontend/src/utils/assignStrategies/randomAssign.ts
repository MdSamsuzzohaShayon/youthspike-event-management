import { EPlayerStatus, IPlayer, IPlayerRank } from '@/types/player';
import { ETeam } from '@/types/team';
import { IMatchRelatives, INetRelatives, IRoundRelatives } from '@/types';
import { IPlayerRankingExpRel } from '@/types';

// --- Types & Interfaces ---

interface IRandomAssignParams {
  matchUp: boolean;
  allNets: INetRelatives[];
  currRoundNets: INetRelatives[];
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  roundList: IRoundRelatives[];
  currRound: IRoundRelatives | null;
  myTeam: ETeam;
  currMatch: IMatchRelatives;
  teamAPlayerRanking: IPlayerRankingExpRel | null;
  teamBPlayerRanking: IPlayerRankingExpRel | null;
}

interface IRandomAssignResult {
  updatedAllNets: INetRelatives[];
  updatedCurrRoundNets: INetRelatives[];
  selectedPlayerIds: string[];
}

// --- Pure Helper Functions ---

/**
 * Fisher-Yates (Knuth) shuffle algorithm for randomizing player order
 */
function shuffleArray<T>(array: T[]): T[] {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

/**
 * Creates a Map for O(1) rank lookups from ranking data
 */
function createRankMap(ranking: IPlayerRankingExpRel | null): Map<string, number> {
  const map = new Map<string, number>();
  ranking?.rankings?.forEach(({ player, rank }) => {
    const playerId = typeof player === 'object' ? player._id : player;
    if (playerId) map.set(playerId, rank);
  });
  return map;
}

/**
 * Builds a map of players to their previous round partners to avoid consecutive pairings.
 * Rule 5: A player cannot pair with the same partner in 2 consecutive rounds.
 */
function buildPrevPartnerMap(
  roundList: IRoundRelatives[],
  currRound: IRoundRelatives | null,
  allNets: INetRelatives[],
  myTeam: ETeam
): Map<string, string | null> {
  const partnerMap = new Map<string, string | null>();
  
  // Skip if it's the first round
  if (!currRound || currRound.num <= 1) return partnerMap;

  const prevRound = roundList.find((r) => r.num === currRound.num - 1);
  if (!prevRound) return partnerMap;

  const prevRoundNets = allNets.filter((net) => net.round === prevRound._id);

  for (const net of prevRoundNets) {
    let playerAId: string | null | undefined = null;
    let playerBId: string | null | undefined = null;

    if (myTeam === ETeam.teamA) {
      playerAId = net.teamAPlayerA;
      playerBId = net.teamAPlayerB;
    } else {
      playerAId = net.teamBPlayerA;
      playerBId = net.teamBPlayerB;
    }

    if (playerAId && playerBId) {
      partnerMap.set(playerAId, playerBId);
      partnerMap.set(playerBId, playerAId);
    }
  }

  return partnerMap;
}

/**
 * Calculates the opponent's pair score for a specific net
 * Rule 6: Matchup variance constraint
 */
function getOpponentPairScore(
  net: INetRelatives,
  myTeam: ETeam,
  opRankingsMap: Map<string, number>
): number | null {
  let opponentPlayerAId: string | null | undefined = null;
  let opponentPlayerBId: string | null | undefined = null;

  if (myTeam === ETeam.teamA) {
    opponentPlayerAId = net.teamBPlayerA;
    opponentPlayerBId = net.teamBPlayerB;
  } else {
    opponentPlayerAId = net.teamAPlayerA;
    opponentPlayerBId = net.teamAPlayerB;
  }

  if (!opponentPlayerAId || !opponentPlayerBId) return null;

  const rankA = opRankingsMap.get(opponentPlayerAId) ?? 0;
  const rankB = opRankingsMap.get(opponentPlayerBId) ?? 0;

  return rankA + rankB;
}

/**
 * Finds a valid pair of players considering previous partners and variance constraints.
 * Returns the first valid pair found (randomized by caller's shuffle).
 */
function findValidPair(
  players: IPlayerRank[],
  prevPartnerMap: Map<string, string | null>,
  targetScore: number | null,
  variance: number
): [IPlayerRank, IPlayerRank] {
  if (players.length < 2) {
    throw new Error("Insufficient available players to form a pair.");
  }

  const validPairs: [IPlayerRank, IPlayerRank][] = [];
  const fallbackPairs: [IPlayerRank, IPlayerRank][] = []; // Pairs that fit variance but break partner rule

  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const playerA = players[i];
      const playerB = players[j];
      const pairScore = playerA.rank + playerB.rank;

      // Rule 6: Enforce variance constraints if targetScore is set
      if (targetScore !== null) {
        const scoreDifference = Math.abs(pairScore - targetScore);
        if (scoreDifference > variance) {
          continue; // Hard constraint: must be within variance
        }
      }

      // Rule 5: Enforce previous partner constraint
      const werePartnersLastRound = prevPartnerMap.get(playerA._id) === playerB._id;

      if (!werePartnersLastRound) {
        validPairs.push([playerA, playerB]);
      } else {
        fallbackPairs.push([playerA, playerB]);
      }
    }
  }

  if (validPairs.length > 0) {
    return validPairs[0]; // Return first valid (already randomized upstream)
  }

  if (fallbackPairs.length > 0) {
    // Fallback: Use a pair that fits variance but breaks the partner rule (edge case fallback)
    return fallbackPairs[0];
  }

  throw new Error("Could not find a valid pair meeting the assignment constraints.");
}

/**
 * Limits players to top 3 for extended overtime
 */
function limitPlayersForOvertime(players: IPlayerRank[]): IPlayerRank[] {
  return players.length > 3 ? players.slice(0, 3) : players;
}


// --- Main Function ---

/**
 * Pure function to perform random assignment of players to nets
 */
function randomAssign(params: IRandomAssignParams): IRandomAssignResult {
  const {
    matchUp,
    allNets,
    currRoundNets,
    roundList,
    currRound,
    myTeam,
    currMatch,
    myPlayers,
    teamAPlayerRanking,
    teamBPlayerRanking,
  } = params;

  if (!myPlayers || myPlayers.length === 0) {
    throw new Error("No players available for assignment.");
  }

  // 1. Prepare ranking maps for O(1) lookups
  const myRankingsData = myTeam === ETeam.teamA ? teamAPlayerRanking : teamBPlayerRanking;
  const opRankingsData = myTeam === ETeam.teamA ? teamBPlayerRanking : teamAPlayerRanking;

  const myRankingsMap = createRankMap(myRankingsData);
  const opRankingsMap = createRankMap(opRankingsData);

  // 2. Attach ranks to my players
  let myPlayersWithRanks: IPlayerRank[] = myPlayers.map((player) => ({
    ...player,
    rank: myRankingsMap.get(player._id) ?? 0,
  }));

  // Sort by rank before limiting (to get the actual top ranks for overtime)
  myPlayersWithRanks.sort((a, b) => a.rank - b.rank);

  // Apply overtime limit if needed
  if (currMatch.extendedOvertime) {
    myPlayersWithRanks = limitPlayersForOvertime(myPlayersWithRanks);
  }

  // 3. Shuffle players for randomness (Rule 2)
  const shuffledPlayers = shuffleArray(myPlayersWithRanks);

  // 4. Build previous partner map (Rule 5)
  const prevPartnerMap = buildPrevPartnerMap(roundList, currRound, allNets, myTeam);

  // 5. Prepare result structures
  const updatedAllNets = allNets.map((net) => ({ ...net }));
  const updatedCurrRoundNets: INetRelatives[] = [];
  const selectedPlayerIds = new Set<string>();

  // 6. Assign players to each net sequentially
  for (const currentNet of currRoundNets) {
    const availablePlayers = shuffledPlayers.filter(
      (player) => !selectedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE
    );

    // Rule 4: Stop if no players are left
    if (availablePlayers.length === 0) {
      break;
    }

    let playerA: IPlayerRank | null = null;
    let playerB: IPlayerRank | null = null;

    if (availablePlayers.length === 1) {
      // Rule 4: Assign single player if only one is left
      playerA = availablePlayers[0];
    } else {
      // Determine target score if matchUp is true (Rule 6)
      let targetScore: number | null = null;
      if (matchUp) {
        const opponentScore = getOpponentPairScore(currentNet, myTeam, opRankingsMap);
        if (opponentScore !== null) {
          targetScore = opponentScore;
        }
      }

      const variance = currMatch.netVariance ?? 0;

      try {
        [playerA, playerB] = findValidPair(
          availablePlayers,
          prevPartnerMap,
          targetScore,
          variance
        );
      } catch (error) {
        console.error(`Assignment error for Net ${currentNet.num}:`, error);
        throw error; // Re-throw to halt process as per instruction
      }
    }

    // Update the net with selected players (Rule 1 & 3)
    const updatedNet = { ...currentNet };
    if (myTeam === ETeam.teamA) {
      updatedNet.teamAPlayerA = playerA?._id ?? null;
      updatedNet.teamAPlayerB = playerB?._id ?? null;
    } else {
      updatedNet.teamBPlayerA = playerA?._id ?? null;
      updatedNet.teamBPlayerB = playerB?._id ?? null;
    }

    updatedCurrRoundNets.push(updatedNet);

    // Mark as selected
    if (playerA) selectedPlayerIds.add(playerA._id);
    if (playerB) selectedPlayerIds.add(playerB._id);

    // Update in allNets clone
    const allNetsIndex = updatedAllNets.findIndex((net) => net._id === currentNet._id);
    if (allNetsIndex !== -1) {
      updatedAllNets[allNetsIndex] = updatedNet;
    }
  }

  return {
    updatedAllNets,
    updatedCurrRoundNets,
    selectedPlayerIds: Array.from(selectedPlayerIds),
  };
}

export default randomAssign;
export type { IRandomAssignParams, IRandomAssignResult };