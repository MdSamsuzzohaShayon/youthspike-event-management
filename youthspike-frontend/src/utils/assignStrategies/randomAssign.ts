/* eslint-disable no-restricted-syntax */
import { EPlayerStatus, IPlayer, IPlayerRank } from '@/types/player';
import { ETeam } from '@/types/team';
import { IMatchRelatives, INetRelatives, IRoundRelatives } from '@/types';
import { IPlayerRankingExpRel } from '@/types';
import findPrevPartner from '../match/findPrevPartner';

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

interface IRankingData {
  myRankingsMap: Map<string, number>;
  opRankingsMap: Map<string, number>;
  mySortedPlayers: IPlayerRank[];
  opSortedPlayers: IPlayerRank[];
}

interface IOpponentPairScore {
  playerAScore: number;
  playerBScore: number;
  totalScore: number;
}

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
 * Find optimal pair based on score condition (max or min)
 */
function findOptimalPairByScore(
  players: IPlayer[],
  scoreLimit: number,
  rankingsMap: Map<string, number>,
  condition: 'max' | 'min'
): [IPlayerRank | null, IPlayerRank | null] {
  let bestPair: [IPlayerRank | null, IPlayerRank | null] = [null, null];
  let bestScore = condition === 'max' ? -Infinity : Infinity;

  for (let i = 0; i < players.length; i += 1) {
    const playerA = players[i];
    const rankA = rankingsMap.get(playerA._id) ?? 0;

    for (let j = i + 1; j < players.length; j += 1) {
      const playerB = players[j];
      const rankB = rankingsMap.get(playerB._id) ?? 0;
      const totalScore = rankA + rankB;

      const isBetterPair = condition === 'max'
        ? totalScore <= scoreLimit && totalScore > bestScore
        : totalScore >= scoreLimit && totalScore < bestScore;

      if (isBetterPair) {
        bestPair = [{ ...playerA, rank: rankA }, { ...playerB, rank: rankB }];
        bestScore = totalScore;
      }
    }
  }

  return bestPair;
}

/**
 * Get opponent pair score for a specific net
 */
function getIOpponentPairScore(
  currRoundNets: INetRelatives[],
  netIndex: number,
  myTeam: ETeam,
  opPlayers: IPlayer[],
  opRankingsMap: Map<string, number>
): IOpponentPairScore | null {
  const net = currRoundNets[netIndex];
  let opponentPlayerAId: string | null = null;
  let opponentPlayerBId: string | null = null;

  if (myTeam === ETeam.teamA) {
    opponentPlayerAId = net.teamBPlayerA || null;
    opponentPlayerBId = net.teamBPlayerB || null;
  } else {
    opponentPlayerAId = net.teamAPlayerA || null;
    opponentPlayerBId = net.teamAPlayerB || null;
  }

  if (!opponentPlayerAId || !opponentPlayerBId) {
    return null;
  }

  const playerAScore = opRankingsMap.get(opponentPlayerAId) ?? 0;
  const playerBScore = opRankingsMap.get(opponentPlayerBId) ?? 0;

  return {
    playerAScore,
    playerBScore,
    totalScore: playerAScore + playerBScore
  };
}

/**
 * Prepare and organize ranking data for both teams
 */
function prepareIRankingData(params: IRandomAssignParams): IRankingData {
  const { myTeam, teamAPlayerRanking, teamBPlayerRanking, myPlayers, opPlayers, currMatch } = params;

  // Extract rankings based on team
  const myRankingsData = myTeam === ETeam.teamA ? teamAPlayerRanking : teamBPlayerRanking;
  const opRankingsData = myTeam === ETeam.teamA ? teamBPlayerRanking : teamAPlayerRanking;

  // Create ranking maps for O(1) lookup
  const myRankingsMap = new Map<string, number>(
    myRankingsData?.rankings?.map(({ player, rank }) => [typeof player === "object" ? player._id : player, rank]) ?? []
  );
  const opRankingsMap = new Map<string, number>(
    opRankingsData?.rankings?.map(({ player, rank }) => [typeof player === "object" ? player._id : player, rank]) ?? []
  );

  // Sort players by rank
  let mySortedPlayers = createSortedPlayerList(myPlayers, myRankingsMap);
  let opSortedPlayers = createSortedPlayerList(opPlayers, opRankingsMap);

  // Limit players for extended overtime
  if (currMatch.extendedOvertime) {
    mySortedPlayers = limitPlayersForOvertime(mySortedPlayers);
    opSortedPlayers = limitPlayersForOvertime(opSortedPlayers);
  }

  return {
    myRankingsMap,
    opRankingsMap,
    mySortedPlayers,
    opSortedPlayers
  };
}

/**
 * Create sorted list of players with their ranks
 */
function createSortedPlayerList(players: IPlayer[], rankingsMap: Map<string, number>): IPlayerRank[] {
  const playersWithRanks = players.map((player) => ({
    ...player,
    rank: rankingsMap.get(player._id) ?? 0
  }));

  return playersWithRanks.sort((a, b) => a.rank - b.rank);
}

/**
 * Limit players to top 3 for extended overtime
 */
function limitPlayersForOvertime(players: IPlayerRank[]): IPlayerRank[] {
  return players.length > 3 ? players.slice(0, 3) : players;
}

/**
 * Find alternative partner that satisfies variance constraints
 */
function findAlternativePartnerWithinVariance(
  currentPlayerA: IPlayer,
  availablePlayers: IPlayer[],
  rankingsMap: Map<string, number>,
  targetScore: number,
  variance: number,
  isAboveMax: boolean
): IPlayerRank | null {
  const currentRank = rankingsMap.get(currentPlayerA._id) ?? 0;
  const maxScore = targetScore + variance;
  const minScore = Math.max(0, targetScore - variance);

  for (const player of availablePlayers) {
    const playerRank = rankingsMap.get(player._id) ?? 0;
    const pairScore = currentRank + playerRank;

    if (player._id === currentPlayerA._id) continue;

    if (isAboveMax && pairScore <= maxScore) {
      return { ...player, rank: playerRank };
    }
    if (!isAboveMax && pairScore >= minScore) {
      return { ...player, rank: playerRank };
    }
  }

  return null;
}

/**
 * Update net with selected players based on team
 */
function updateNetWithPlayers(
  net: INetRelatives,
  playerA: IPlayer,
  playerB: IPlayer,
  team: ETeam
): INetRelatives {
  const updatedNet = { ...net };

  if (team === ETeam.teamA) {
    updatedNet.teamAPlayerA = playerA._id;
    updatedNet.teamAPlayerB = playerB._id;
  } else {
    updatedNet.teamBPlayerA = playerA._id;
    updatedNet.teamBPlayerB = playerB._id;
  }

  return updatedNet;
}

/**
 * Validate that we have enough available players
 */
function validateAvailablePlayers(availableCount: number, requiredCount: number = 2): void {
  if (availableCount < requiredCount) {
    throw new Error(`Insufficient available players. Required: ${requiredCount}, Available: ${availableCount}`);
  }
}

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
  } = params;

  // Prepare ranking data
  const rankingData = prepareIRankingData(params);
  const { myRankingsMap, opRankingsMap, mySortedPlayers } = rankingData;

  // Shuffle players for randomness
  const randomizedPlayers = shuffleArray(mySortedPlayers);

  // Track selected players
  const selectedPlayerIds = new Set<string>();

  // Create deep copies of nets to maintain immutability
  const updatedAllNets = allNets.map((net) => ({ ...net }));
  const updatedCurrRoundNets: INetRelatives[] = [];

  // Process each net in current round
  for (let netIndex = 0; netIndex < currRoundNets.length; netIndex += 1) {
    const currentNet = currRoundNets[netIndex];

    // Filter available players (not selected and active)
    const availablePlayers = randomizedPlayers.filter(
      (player) => !selectedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE
    );

    try {
      validateAvailablePlayers(availablePlayers.length);
    } catch (error) {
      console.error('Assignment error:', error);
      break;
    }

    // Initial player selection
    let selectedPlayerA = availablePlayers[0];
    let selectedPlayerB = availablePlayers[1];

    // Check previous partner constraint
    const previousPartnerId = findPrevPartner({
      roundList,
      currRound,
      allNets,
      myTeamE: myTeam,
      net: currentNet
    });

    // Get opponent pair score for matchup optimization
    let opponentTotalScore = 0;
    if (matchUp) {
      const opponentScores = getIOpponentPairScore(
        currRoundNets,
        netIndex,
        myTeam,
        params.opPlayers,
        opRankingsMap
      );
      opponentTotalScore = opponentScores?.totalScore ?? 0;
    }

    // Avoid pairing with previous round's partner
    if (matchUp && previousPartnerId && selectedPlayerB?._id === previousPartnerId) {
      const [newPlayerA, newPlayerB] = findOptimalPairByScore(
        availablePlayers,
        opponentTotalScore,
        opRankingsMap,
        'max'
      );
      selectedPlayerA = newPlayerA || selectedPlayerA;
      selectedPlayerB = newPlayerB || selectedPlayerB;
    }

    // Apply net variance constraints if applicable
    if (currMatch.netVariance && opponentTotalScore > 0) {
      const playerAScore = myRankingsMap.get(selectedPlayerA._id) ?? 0;
      const playerBScore = myRankingsMap.get(selectedPlayerB._id) ?? 0;
      const pairScore = playerAScore + playerBScore;

      const maxScore = opponentTotalScore + currMatch.netVariance;
      const minScore = Math.max(0, opponentTotalScore - currMatch.netVariance);

      if (pairScore > maxScore && matchUp) {
        const alternativePartner = findAlternativePartnerWithinVariance(
          selectedPlayerA,
          availablePlayers,
          myRankingsMap,
          opponentTotalScore,
          currMatch.netVariance,
          true
        );
        if (alternativePartner) {
          selectedPlayerB = alternativePartner;
        }
      } else if (pairScore < minScore && matchUp) {
        const alternativePartner = findAlternativePartnerWithinVariance(
          selectedPlayerA,
          availablePlayers,
          myRankingsMap,
          opponentTotalScore,
          currMatch.netVariance,
          false
        );
        if (alternativePartner) {
          selectedPlayerB = alternativePartner;
        }
      }
    }

    // Update net with selected players
    const updatedNet = updateNetWithPlayers(currentNet, selectedPlayerA, selectedPlayerB, myTeam);
    updatedCurrRoundNets.push(updatedNet);

    // Mark players as selected
    selectedPlayerIds.add(selectedPlayerA._id);
    selectedPlayerIds.add(selectedPlayerB._id);

    // Update in all nets clone
    const allNetsIndex = updatedAllNets.findIndex((net) => net._id === currentNet._id);
    if (allNetsIndex !== -1) {
      updatedAllNets[allNetsIndex] = updatedNet;
    }
  }

  return {
    updatedAllNets,
    updatedCurrRoundNets,
    selectedPlayerIds: Array.from(selectedPlayerIds)
  };
}

export default randomAssign;
export type { IRandomAssignParams, IRandomAssignResult };



/*
 dispatch(setCurrentRoundNets(newCurrRoundNets));
  dispatch(setNets(allNetsClone));
  dispatch(setDisabledPlayerIds(Array.from(selectedPlayerIds)));
 */
