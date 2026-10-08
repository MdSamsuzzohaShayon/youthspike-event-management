import { IPlayer, IPlayerRank } from '@/types/player';
import { ETeam } from '@/types/team';
import { IMatchRelatives, INetRelatives, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import {
  createRankMap,
  organizeRankings,
  buildPrevPartnerMap,
  getLeftOutPlayerIds,
  getOpponentPairScore,
  initializeNetStructures,
  updateNetWithPlayers,
  syncNetToAllNets,
  getAvailablePlayers,
  getRankedSortedPlayers,
  limitPlayersForOvertime,
} from './assignmentHelpers';

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

type PlayerPair = [IPlayerRank, IPlayerRank];
type PrevPartnerMap = ReadonlyMap<string, string | null>;
type RankMap = ReturnType<typeof createRankMap>;

const MIN_PLAYERS_FOR_PAIR = 2;

// --- Pure Helper Functions ---

/** Fisher-Yates shuffle. Returns a new array; `random` is injectable for deterministic tests. */
function shuffleArray<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Shuffles players, keeping those left out last round in front (single pass split). */
function buildShuffledPlayerOrder(players: IPlayerRank[], leftOutPlayerIds: ReadonlySet<string>): IPlayerRank[] {
  const leftOutPlayers: IPlayerRank[] = [];
  const otherPlayers: IPlayerRank[] = [];

  for (const player of players) {
    (leftOutPlayerIds.has(player._id) ? leftOutPlayers : otherPlayers).push(player);
  }

  return [...shuffleArray(leftOutPlayers), ...shuffleArray(otherPlayers)];
}

const werePartnersLastRound = (a: IPlayerRank, b: IPlayerRank, prevPartnerMap: PrevPartnerMap): boolean =>
  prevPartnerMap.get(a._id) === b._id || prevPartnerMap.get(b._id) === a._id;

/** Opponent's pair score for this net, or null when match-up doesn't apply. */
function resolveTargetScore(params: {
  matchUp: boolean;
  currentNet: INetRelatives;
  myTeam: ETeam;
  opRankMap: RankMap;
}): number | null {
  const { matchUp, currentNet, myTeam, opRankMap } = params;
  return matchUp ? getOpponentPairScore(currentNet, myTeam, opRankMap) : null;
}

/**
 * Returns the first pair within variance that wasn't paired last round.
 * If every in-variance pair was paired last round, returns the first of those.
 * Returns null when nothing satisfies the variance constraint.
 */
function findValidPair(
  players: IPlayerRank[],
  prevPartnerMap: PrevPartnerMap,
  targetScore: number | null,
  variance: number
): PlayerPair | null {
  let fallbackPair: PlayerPair | null = null;

  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const playerA = players[i];
      const playerB = players[j];

      if (targetScore !== null && Math.abs(playerA.rank + playerB.rank - targetScore) > variance) {
        continue;
      }

      if (!werePartnersLastRound(playerA, playerB, prevPartnerMap)) {
        return [playerA, playerB]; // early exit: no need to enumerate the rest
      }
      fallbackPair ??= [playerA, playerB];
    }
  }

  return fallbackPair;
}

// --- Main Function ---

/**
 * Assigns players to nets randomly, subject to variance and previous-partner rules.
 * Does not mutate its inputs; all changes happen on the cloned structures it returns.
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

  if (!myPlayers?.length) {
    throw new Error('No players available for assignment.');
  }

  // Ranking lookups (O(1))
  const { myRankings, opRankings } = organizeRankings({
    myTeamE: myTeam,
    teamAPlayerRanking,
    teamBPlayerRanking,
  });
  const myRankMap = createRankMap(myRankings);
  const opRankMap = createRankMap(opRankings);

  // Ranked players (overtime-limited if needed), shuffled with left-out players first
  const rankedPlayers = getRankedSortedPlayers(myPlayers, myRankMap);
  const eligiblePlayers = currMatch.extendedOvertime ? limitPlayersForOvertime(rankedPlayers) : rankedPlayers;
  const leftOutPlayerIds = getLeftOutPlayerIds(myPlayers, roundList, currRound, allNets, myTeam);
  const shuffledPlayers = buildShuffledPlayerOrder(eligiblePlayers, leftOutPlayerIds);

  const prevPartnerMap = buildPrevPartnerMap(roundList, currRound, allNets, myTeam);
  const variance = currMatch.netVariance ?? 0;

  const { updatedAllNets, updatedCurrRoundNets, selectedPlayerIds } = initializeNetStructures(allNets, currRoundNets);

  for (const currentNet of currRoundNets) {
    const availablePlayers = getAvailablePlayers(shuffledPlayers, selectedPlayerIds);
    if (availablePlayers.length === 0) break;

    let playerA: IPlayerRank = availablePlayers[0];
    let playerB: IPlayerRank | null = null;

    if (availablePlayers.length >= MIN_PLAYERS_FOR_PAIR) {
      const targetScore = resolveTargetScore({ matchUp, currentNet, myTeam, opRankMap });
      const pair = findValidPair(availablePlayers, prevPartnerMap, targetScore, variance);

      if (!pair) {
        const message = `Could not find a valid pair for Net ${currentNet.num} meeting the assignment constraints.`;
        console.error(message);
        throw new Error(message); // propagate to the UI layer
      }
      [playerA, playerB] = pair;
    }

    const updatedNet = updateNetWithPlayers(currentNet, playerA, playerB, myTeam);
    updatedCurrRoundNets.push(updatedNet);
    syncNetToAllNets(updatedAllNets, currentNet, updatedNet);

    selectedPlayerIds.add(playerA._id);
    if (playerB) selectedPlayerIds.add(playerB._id);
  }

  return {
    updatedAllNets,
    updatedCurrRoundNets,
    selectedPlayerIds: Array.from(selectedPlayerIds),
  };
}

export default randomAssign;
export type { IRandomAssignParams, IRandomAssignResult };