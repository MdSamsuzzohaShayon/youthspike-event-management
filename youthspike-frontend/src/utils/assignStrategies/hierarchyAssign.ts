import { IPlayer, IPlayerRank } from '@/types/player';
import { ETeam } from '@/types/team';
import { IMatchRelatives, INetRelatives, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import {
  createRankMap,
  organizeRankings,
  getPlayerRank,
  getRankedSortedPlayers,
  getLeftOutPlayerIds,
  getAvailablePlayers,
  getOpponentPairScore,
  findPrevPartnerId,
  initializeNetStructures,
  updateNetWithPlayers,
  syncNetToAllNets,
} from './assignmentHelpers';

// --- Types & Interfaces ---

interface IHierarchyAssignParams {
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

interface IHierarchyAssignResult {
  updatedAllNets: INetRelatives[];
  updatedCurrRoundNets: INetRelatives[];
  selectedPlayerIds: string[];
}

type RankMap = ReturnType<typeof createRankMap>;

interface IPairScoreBounds {
  min: number;
  max: number;
}

const PLAYERS_PER_NET = 2;

// --- Pure helpers ---

const getTeamPlayerBId = (net: INetRelatives, isTeamA: boolean) =>
  isTeamA ? net.teamAPlayerB : net.teamBPlayerB;

const withTeamPlayerB = (net: INetRelatives, isTeamA: boolean, playerId: string): INetRelatives =>
  isTeamA ? { ...net, teamAPlayerB: playerId } : { ...net, teamBPlayerB: playerId };

const getPairScoreBounds = (opponentPairScore: number, variance: number): IPairScoreBounds => ({
  min: Math.max(0, opponentPairScore - variance),
  max: opponentPairScore + variance,
});

/**
 * Returns a partner whose pair score with `topPlayer` falls inside `bounds`.
 * Falls back to `currentPartner` when the score is already in range or no candidate fits.
 */
function findPartnerWithinBounds(params: {
  topPlayer: IPlayerRank;
  currentPartner: IPlayerRank | null;
  candidates: IPlayerRank[];
  selectedPlayerIds: ReadonlySet<string>;
  rankMap: RankMap;
  bounds: IPairScoreBounds;
}): IPlayerRank | null {
  const { topPlayer, currentPartner, candidates, selectedPlayerIds, rankMap, bounds } = params;

  const topPlayerRank = getPlayerRank(rankMap, topPlayer._id);
  const currentScore = topPlayerRank + getPlayerRank(rankMap, currentPartner?._id);

  const isTooHigh = currentScore > bounds.max;
  const isTooLow = currentScore < bounds.min;
  if (!isTooHigh && !isTooLow) return currentPartner;

  const isScoreAcceptable = (score: number) => (isTooHigh ? score <= bounds.max : score >= bounds.min);

  const betterPartner = candidates.find(
    (candidate) =>
      candidate._id !== topPlayer._id &&
      !selectedPlayerIds.has(candidate._id) &&
      isScoreAcceptable(topPlayerRank + getPlayerRank(rankMap, candidate._id))
  );

  return betterPartner ?? currentPartner;
}

/**
 * Used when only two players remain and they were partners last round.
 * Puts `incomingPlayerId` in the previous net's "B" slot and returns the displaced player
 * so they can partner with the current top player instead.
 * Mutates `updatedCurrRoundNets`, `updatedAllNets` and `selectedPlayerIds`.
 */
function swapPartnerIntoPreviousNet(params: {
  updatedCurrRoundNets: INetRelatives[];
  updatedAllNets: INetRelatives[];
  selectedPlayerIds: Set<string>;
  isTeamA: boolean;
  incomingPlayerId: string;
  findMyPlayer: (playerId: string) => IPlayerRank | null;
}): IPlayerRank | null {
  const { updatedCurrRoundNets, updatedAllNets, selectedPlayerIds, isTeamA, incomingPlayerId, findMyPlayer } = params;

  const previousNetIndex = updatedCurrRoundNets.length - 1;
  if (previousNetIndex < 0) return null;

  const previousNet = updatedCurrRoundNets[previousNetIndex];
  const displacedPlayerId = getTeamPlayerBId(previousNet, isTeamA);
  if (!displacedPlayerId) return null;

  const updatedPreviousNet = withTeamPlayerB(previousNet, isTeamA, incomingPlayerId);
  updatedCurrRoundNets[previousNetIndex] = updatedPreviousNet;
  syncNetToAllNets(updatedAllNets, previousNet, updatedPreviousNet); // keep allNets clone in sync
  selectedPlayerIds.add(incomingPlayerId);

  return findMyPlayer(displacedPlayerId);
}

// --- Main Function ---

/**
 * Assigns players to nets by ranking hierarchy.
 * Does not mutate its inputs; all changes happen on the cloned structures it returns.
 */
function hierarchyAssign(params: IHierarchyAssignParams): IHierarchyAssignResult {
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
  const mySortedPlayers = getRankedSortedPlayers(myPlayers, myRankMap, leftOutPlayerIds);
  const findMyPlayer = (playerId: string): IPlayerRank | null =>
    mySortedPlayers.find((player) => player._id === playerId) ?? null;

  const { updatedAllNets, updatedCurrRoundNets, selectedPlayerIds } = initializeNetStructures(allNets, currRoundNets);
  const isTeamA = myTeamE === ETeam.teamA;
  const netVariance = currMatch.netVariance;
  const shouldBalanceByVariance = Boolean(netVariance) && matchUp;

  for (const currentNet of currRoundNets) {
    const availablePlayers = getAvailablePlayers(mySortedPlayers, selectedPlayerIds);

    if (availablePlayers.length < PLAYERS_PER_NET) {
      console.error('Not enough available players');
      break;
    }

    const topPlayer: IPlayerRank = availablePlayers[0];
    let partner: IPlayerRank | null = availablePlayers[1];

    // Overtime: top two players, no further checks
    if (!currMatch.extendedOvertime) {
      // Avoid repeating last round's partner
      const previousPartnerId = findPrevPartnerId(roundList, currRound, allNets, myTeamE, topPlayer._id);
      if (previousPartnerId && partner?._id === previousPartnerId) {
        partner =
          availablePlayers[2] ??
          swapPartnerIntoPreviousNet({
            updatedCurrRoundNets,
            updatedAllNets,
            selectedPlayerIds,
            isTeamA,
            incomingPlayerId: availablePlayers[1]._id,
            findMyPlayer,
          });
      }

      // Keep pair score close to the opponent's pair score
      if (shouldBalanceByVariance && netVariance) {
        const opponentPairScore = getOpponentPairScore(currentNet, myTeamE, opRankMap);
        if (opponentPairScore !== null) {
          partner = findPartnerWithinBounds({
            topPlayer,
            currentPartner: partner,
            candidates: availablePlayers,
            selectedPlayerIds,
            rankMap: myRankMap,
            bounds: getPairScoreBounds(opponentPairScore, netVariance),
          });
        }
      }
    }

    const updatedNet = updateNetWithPlayers(currentNet, topPlayer, partner, myTeamE);
    updatedCurrRoundNets.push(updatedNet);
    syncNetToAllNets(updatedAllNets, currentNet, updatedNet);

    selectedPlayerIds.add(topPlayer._id);
    if (partner) selectedPlayerIds.add(partner._id);
  }

  return {
    updatedAllNets,
    updatedCurrRoundNets,
    selectedPlayerIds: Array.from(selectedPlayerIds),
  };
}

export default hierarchyAssign;
export type { IHierarchyAssignParams, IHierarchyAssignResult };