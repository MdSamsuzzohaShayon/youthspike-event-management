import { IPlayer, IPlayerRank } from '@/types/player';
import { ETeam } from '@/types/team';
import { IMatchRelatives, INetRelatives, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import {
  createRankMap,
  organizeRankings,
  getPlayerRank,
  getRankedSortedPlayers,
  getLeftOutPlayerIds,
  limitPlayersForOvertime,
  findPrevPartnerId,
  getOpponentPairScore,
  initializeNetStructures,
  updateNetWithPlayers,
  syncNetToAllNets,
  getAvailablePlayers,
} from './assignmentHelpers';

// --- Types & Interfaces ---

interface IAnchorAssignParams {
  matchUp: boolean;
  allNets: INetRelatives[];
  currRoundNets: INetRelatives[];
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  roundList: IRoundRelatives[];
  currRound: IRoundRelatives | null;
  myTeamE: ETeam;
  currMatch: IMatchRelatives;
  teamAPlayerRanking: IPlayerRankingExpRel | null;
  teamBPlayerRanking: IPlayerRankingExpRel | null;
}

interface IAnchorAssignResult {
  updatedAllNets: INetRelatives[];
  updatedCurrRoundNets: INetRelatives[];
  selectedPlayerIds: string[];
}

interface IPairScoreBounds {
  min: number;
  max: number;
}

interface IPlayerPair {
  playerA: IPlayerRank;
  playerB: IPlayerRank;
}

type RankMap = ReturnType<typeof createRankMap>;
type PrevPartnerId = string | null | undefined;

const MIN_PLAYERS_FOR_PAIR = 2;

// --- Pure Helper Functions ---

const isScoreInBounds = (score: number, { min, max }: IPairScoreBounds): boolean =>
  score >= min && score <= max;

/** Opponent's pair score ± variance, or null when variance matching doesn't apply. */
function resolvePairScoreBounds(params: {
  matchUp: boolean;
  netVariance: number | null | undefined;
  currentNet: INetRelatives;
  myTeamE: ETeam;
  opRankMap: RankMap;
}): IPairScoreBounds | null {
  const { matchUp, netVariance, currentNet, myTeamE, opRankMap } = params;
  if (!matchUp || !netVariance) return null;

  const opponentPairScore = getOpponentPairScore(currentNet, myTeamE, opRankMap);
  if (opponentPairScore === null) return null;

  return {
    min: Math.max(0, opponentPairScore - netVariance),
    max: opponentPairScore + netVariance,
  };
}

/**
 * Anchor = first player. Default partner = last player, or second-to-last
 * when the last player was the anchor's previous partner.
 * Returns null when no distinct partner exists.
 */
function selectInitialPartnerIndex(players: IPlayerRank[], prevPartnerId: PrevPartnerId): number | null {
  const lastIndex = players.length - 1;
  const partnerIndex = players[lastIndex]._id === prevPartnerId ? lastIndex - 1 : lastIndex;
  return partnerIndex >= 1 ? partnerIndex : null; // index 0 is the anchor itself
}

/** Score too high: shift the anchor down the list and look for a lower-scoring partner after it. */
function findPairForHighScore(
  players: IPlayerRank[],
  ranks: number[],
  bounds: IPairScoreBounds,
  prevPartnerId: PrevPartnerId,
  maxAnchorIndex: number
): IPlayerPair | null {
  for (let anchorIndex = 1; anchorIndex <= maxAnchorIndex; anchorIndex += 1) {
    let partnerIndex = anchorIndex + 1;
    while (partnerIndex < players.length && !isScoreInBounds(ranks[anchorIndex] + ranks[partnerIndex], bounds)) {
      partnerIndex += 1;
    }
    if (partnerIndex >= players.length) continue;

    const partner = players[partnerIndex];
    if (partner._id === prevPartnerId) continue;

    return { playerA: players[anchorIndex], playerB: partner };
  }
  return null;
}

/** Score too low: shift the anchor down the list and pair it with a player counted from the end. */
function findPairForLowScore(
  players: IPlayerRank[],
  ranks: number[],
  bounds: IPairScoreBounds,
  prevPartnerId: PrevPartnerId,
  maxAnchorIndex: number
): IPlayerPair | null {
  for (let anchorIndex = 1; anchorIndex <= maxAnchorIndex; anchorIndex += 1) {
    const partnerIndex = players.length - 1 - anchorIndex;
    if (partnerIndex < 0 || partnerIndex === anchorIndex) continue; // never pair a player with themself

    if (!isScoreInBounds(ranks[anchorIndex] + ranks[partnerIndex], bounds)) continue;

    const partner = players[partnerIndex];
    if (partner._id === prevPartnerId) continue;

    return { playerA: players[anchorIndex], playerB: partner };
  }
  return null;
}

/** Finds a valid pair using the anchor strategy, honoring variance bounds and the previous partner. */
function findValidAnchorPair(
  availablePlayers: IPlayerRank[],
  rankMap: RankMap,
  bounds: IPairScoreBounds | null,
  prevPartnerId: PrevPartnerId
): IPlayerPair | null {
  if (availablePlayers.length < MIN_PLAYERS_FOR_PAIR) return null;

  const partnerIndex = selectInitialPartnerIndex(availablePlayers, prevPartnerId);
  if (partnerIndex === null) return null;

  const initialPair: IPlayerPair = {
    playerA: availablePlayers[0],
    playerB: availablePlayers[partnerIndex],
  };
  if (!bounds) return initialPair;

  // Look up each rank once instead of on every comparison
  const ranks = availablePlayers.map((player) => getPlayerRank(rankMap, player._id));
  const initialScore = ranks[0] + ranks[partnerIndex];
  if (isScoreInBounds(initialScore, bounds)) return initialPair;

  const maxAnchorIndex = Math.min(Math.ceil(availablePlayers.length / 2), availablePlayers.length - 1);
  return initialScore > bounds.max
    ? findPairForHighScore(availablePlayers, ranks, bounds, prevPartnerId, maxAnchorIndex)
    : findPairForLowScore(availablePlayers, ranks, bounds, prevPartnerId, maxAnchorIndex);
}

// --- Main Function ---

/**
 * Assigns players to nets using the anchor strategy.
 * Does not mutate its inputs; all changes happen on the cloned structures it returns.
 */
function anchorAssign(params: IAnchorAssignParams): IAnchorAssignResult {
  const {
    matchUp,
    allNets,
    currRoundNets,
    myPlayers,
    roundList,
    currRound,
    myTeamE,
    currMatch,
    teamAPlayerRanking,
    teamBPlayerRanking,
  } = params;

  if (!myPlayers?.length) {
    throw new Error('No players available for assignment.');
  }

  // Ranking lookups (O(1))
  const { myRankings, opRankings } = organizeRankings({ myTeamE, teamAPlayerRanking, teamBPlayerRanking });
  const myRankMap = createRankMap(myRankings);
  const opRankMap = createRankMap(opRankings);

  // Players sorted by rank, left-out players from the previous round first
  const leftOutPlayerIds = getLeftOutPlayerIds(myPlayers, roundList, currRound, allNets, myTeamE);
  const rankedPlayers = getRankedSortedPlayers(myPlayers, myRankMap, leftOutPlayerIds);
  const mySortedPlayers = currMatch.extendedOvertime ? limitPlayersForOvertime(rankedPlayers) : rankedPlayers;

  const { updatedAllNets, updatedCurrRoundNets, selectedPlayerIds } = initializeNetStructures(allNets, currRoundNets);

  for (const currentNet of currRoundNets) {
    const availablePlayers = getAvailablePlayers(mySortedPlayers, selectedPlayerIds);

    if (availablePlayers.length < MIN_PLAYERS_FOR_PAIR) {
      console.error('Not enough available players');
      break;
    }

    const prevPartnerId = findPrevPartnerId(roundList, currRound, allNets, myTeamE, availablePlayers[0]._id);
    const bounds = resolvePairScoreBounds({
      matchUp,
      netVariance: currMatch.netVariance,
      currentNet,
      myTeamE,
      opRankMap,
    });

    const pair = findValidAnchorPair(availablePlayers, myRankMap, bounds, prevPartnerId);
    if (!pair) {
      console.error(`Could not find valid pair for Net ${currentNet.num}`);
      continue;
    }

    const updatedNet = updateNetWithPlayers(currentNet, pair.playerA, pair.playerB, myTeamE);
    updatedCurrRoundNets.push(updatedNet);
    syncNetToAllNets(updatedAllNets, currentNet, updatedNet);

    selectedPlayerIds.add(pair.playerA._id);
    selectedPlayerIds.add(pair.playerB._id);
  }

  return {
    updatedAllNets,
    updatedCurrRoundNets,
    selectedPlayerIds: Array.from(selectedPlayerIds),
  };
}

export default anchorAssign;
export type { IAnchorAssignParams, IAnchorAssignResult };