import { EPlayerStatus, IPlayer, IPlayerRank } from '@/types/player';
import { ETeam } from '@/types/team';
import { INetRelatives, IPlayerRankingExpRel, IPlayerRankingItemExpRel, IRoundRelatives } from '@/types';
import { ETeamPlayer } from '@/types/net';

// --- Types & Interfaces ---

interface IOrganizeRankingsParams {
  myTeamE: ETeam;
  teamAPlayerRanking: IPlayerRankingExpRel | null;
  teamBPlayerRanking: IPlayerRankingExpRel | null;
}

interface IReturnRankings {
  myRankings: IPlayerRankingItemExpRel[];
  opRankings: IPlayerRankingItemExpRel[];
}

// --- Helper Functions ---

/**
 * Creates a Map for O(1) rank lookups from ranking data
 */
export function createRankMap(rankings: IPlayerRankingItemExpRel[] | undefined): Map<string, number> {
  const map = new Map<string, number>();
  rankings?.forEach(({ player, rank }) => {
    const playerId = typeof player === 'object' ? player._id : player;
    if (playerId) map.set(playerId, rank);
  });
  return map;
}

/**
 * Organizes rankings based on team side
 */
export function organizeRankings({ myTeamE, teamAPlayerRanking, teamBPlayerRanking }: IOrganizeRankingsParams): IReturnRankings {
  const teamARankings = teamAPlayerRanking?.rankings ?? [];
  const teamBRankings = teamBPlayerRanking?.rankings ?? [];

  if (myTeamE === ETeam.teamA) {
    return { myRankings: teamARankings, opRankings: teamBRankings };
  } 
  
  return { myRankings: teamBRankings, opRankings: teamARankings };
}

/**
 * Returns the rank number for a given player from the map
 */
export function getPlayerRank(rankingsMap: Map<string, number>, playerId: string | null | undefined): number {
  if (!playerId) return 0;
  return rankingsMap.get(playerId) ?? 0;
}

/**
 * Maps players with their ranks and sorts by rank.
 * If priorityIds are provided, those players are sorted to the front.
 */
export function getRankedSortedPlayers(
  players: IPlayer[], 
  rankingsMap: Map<string, number>, 
  priorityIds?: Set<string>
): IPlayerRank[] {
  return players
    .map((player) => ({
      ...player,
      rank: rankingsMap.get(player._id) ?? 0,
    }))
    .sort((a, b) => {
      const aPriority = priorityIds?.has(a._id) ? 0 : 1;
      const bPriority = priorityIds?.has(b._id) ? 0 : 1;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.rank - b.rank;
    });
}

/**
 * Limits players to top 3 for extended overtime
 */
export function limitPlayersForOvertime(players: IPlayerRank[]): IPlayerRank[] {
  return players.length > 3 ? players.slice(0, 3) : players;
}

/**
 * Retrieves previous round nets based on the current round's index in the list
 */
function getPrevRoundNets(
  roundList: IRoundRelatives[],
  currRound: IRoundRelatives | null,
  allNets: INetRelatives[]
): INetRelatives[] {
  if (!currRound) return [];

  const currRoundIndex = roundList.findIndex((round) => round._id === currRound._id);
  if (currRoundIndex <= 0) return [];

  const prevRoundId = roundList[currRoundIndex - 1]._id;
  return allNets.filter((net) => net.round === prevRoundId);
}

/**
 * Builds a map of players to their previous round partners to avoid consecutive pairings.
 */
export function buildPrevPartnerMap(
  roundList: IRoundRelatives[],
  currRound: IRoundRelatives | null,
  allNets: INetRelatives[],
  myTeam: ETeam
): Map<string, string | null> {
  const partnerMap = new Map<string, string | null>();
  const prevRoundNets = getPrevRoundNets(roundList, currRound, allNets);

  for (const net of prevRoundNets) {
    const playerAId = myTeam === ETeam.teamA ? net.teamAPlayerA : net.teamBPlayerA;
    const playerBId = myTeam === ETeam.teamA ? net.teamAPlayerB : net.teamBPlayerB;

    if (playerAId && playerBId) {
      partnerMap.set(playerAId, playerBId);
      partnerMap.set(playerBId, playerAId);
    }
  }

  return partnerMap;
}

/**
 * Retrieves IDs of players who were active but not assigned, or explicitly subbed, in the previous round.
 * This enforces the rule that left-out players must be prioritized in subsequent rounds.
 */
export function getLeftOutPlayerIds(
  players: IPlayer[],
  roundList: IRoundRelatives[],
  currRound: IRoundRelatives | null,
  allNets: INetRelatives[],
  myTeam: ETeam
): Set<string> {
  const leftOutIds = new Set<string>();
  if (!currRound) return leftOutIds;

  const currRoundIndex = roundList.findIndex((round) => round._id === currRound._id);
  if (currRoundIndex <= 0) return leftOutIds; // First round, no one is left out yet

  const prevRound = roundList[currRoundIndex - 1];
  const prevRoundNets = allNets.filter((net) => net.round === prevRound._id);

  if (prevRoundNets.length === 0) return leftOutIds;

  const assignedIds = new Set<string>();
  const playerKeyA = myTeam === ETeam.teamA ? 'teamAPlayerA' : 'teamBPlayerA';
  const playerKeyB = myTeam === ETeam.teamA ? 'teamAPlayerB' : 'teamBPlayerB';

  for (const net of prevRoundNets) {
    if (net[playerKeyA]) assignedIds.add(net[playerKeyA] as string);
    if (net[playerKeyB]) assignedIds.add(net[playerKeyB] as string);
  }

  const prevSubs = new Set(prevRound.subs ?? []);

  for (const player of players) {
    // If they didn't play in the previous round (either not assigned OR explicitly subbed)
    if ((player.status === EPlayerStatus.ACTIVE || prevSubs.has(player._id)) && !assignedIds.has(player._id)) {
      leftOutIds.add(player._id);
    }
  }

  return leftOutIds;
}

/**
 * Finds the previous partner ID for a specific player
 */
export function findPrevPartnerId(
  roundList: IRoundRelatives[],
  currRound: IRoundRelatives | null,
  allNets: INetRelatives[],
  myTeamE: ETeam,
  playerAId: string | null
): string | null {
  if (!currRound || !playerAId) return null;

  const prevRoundNets = getPrevRoundNets(roundList, currRound, allNets);
  if (prevRoundNets.length === 0) return null;

  const isTeamA = myTeamE === ETeam.teamA;
  const playerKey = isTeamA ? 'teamAPlayerA' : 'teamBPlayerA';
  const partnerKey = isTeamA ? 'teamAPlayerB' : 'teamBPlayerB';

  const prevPlayedNet = prevRoundNets.find(
    (prn) => prn[playerKey] === playerAId || prn[partnerKey] === playerAId
  );

  if (!prevPlayedNet) return null;

  return prevPlayedNet[playerKey] === playerAId 
    ? prevPlayedNet[partnerKey] ?? null 
    : prevPlayedNet[playerKey] ?? null;
}

/**
 * Gets opponent pair score for a specific net
 */
export function getOpponentPairScore(
  net: INetRelatives,
  myTeam: ETeam,
  opRankingsMap: Map<string, number>
): number | null {
  const opponentPlayerAId = myTeam === ETeam.teamA ? net.teamBPlayerA : net.teamAPlayerA;
  const opponentPlayerBId = myTeam === ETeam.teamA ? net.teamBPlayerB : net.teamAPlayerB;

  if (!opponentPlayerAId || !opponentPlayerBId) return null;

  const rankA = opRankingsMap.get(opponentPlayerAId) ?? 0;
  const rankB = opRankingsMap.get(opponentPlayerBId) ?? 0;

  return rankA + rankB;
}

/**
 * Clones nets and prepares result structures
 */
export function initializeNetStructures(allNets: INetRelatives[], currRoundNets: INetRelatives[]) {
  return {
    updatedAllNets: allNets.map((net) => ({ ...net })),
    updatedCurrRoundNets: [] as INetRelatives[],
    selectedPlayerIds: new Set<string>(),
  };
}

/**
 * Updates net with selected players
 */
export function updateNetWithPlayers(
  currentNet: INetRelatives,
  playerA: IPlayerRank | null,
  playerB: IPlayerRank | null,
  myTeam: ETeam
): INetRelatives {
  const updatedNet = { ...currentNet };
  
  if (myTeam === ETeam.teamA) {
    updatedNet.teamAPlayerA = playerA?._id ?? null;
    updatedNet.teamAPlayerB = playerB?._id ?? null;
  } else {
    updatedNet.teamBPlayerA = playerA?._id ?? null;
    updatedNet.teamBPlayerB = playerB?._id ?? null;
  }
  
  return updatedNet;
}

/**
 * Synchronizes the updated net back into the allNets clone
 */
export function syncNetToAllNets(
  updatedAllNets: INetRelatives[],
  currentNet: INetRelatives,
  updatedNet: INetRelatives
): void {
  const allNetsIndex = updatedAllNets.findIndex((net) => net._id === currentNet._id);
  if (allNetsIndex !== -1) {
    updatedAllNets[allNetsIndex] = updatedNet;
  }
}

/**
 * Filters available players (not selected and active)
 */
export function getAvailablePlayers(
  players: IPlayerRank[],
  selectedPlayerIds: Set<string>
): IPlayerRank[] {
  return players.filter(
    (player) => !selectedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE
  );
}





// ... (Keep all existing helpers from the previous response) ...

/**
 * Calculates which players would violate the variance constraint if placed in a specific spot.
 * This is used to disable invalid players in the manual selection UI.
 */
export function getOutOfRangePlayerIds(
  players: IPlayer[],
  net: INetRelatives,
  myTeam: ETeam,
  spot: ETeamPlayer,
  myRankingsMap: Map<string, number>,
  opRankingsMap: Map<string, number>,
  matchVariance: number | undefined
): string[] {
  if (!matchVariance) return [];

  const opponentScore = getOpponentPairScore(net, myTeam, opRankingsMap);
  if (opponentScore === null) return [];

  const minPairScore = Math.max(0, opponentScore - matchVariance);
  const maxPairScore = opponentScore + matchVariance;

  const isTeamA = myTeam === ETeam.teamA;
  
  // Find the player already occupying the OTHER spot in this net
  const otherSpotId = spot === ETeamPlayer.PLAYER_A
    ? (isTeamA ? net.teamAPlayerB : net.teamBPlayerB)
    : (isTeamA ? net.teamAPlayerA : net.teamBPlayerA);

  if (!otherSpotId) return []; // Can't calculate variance without the partner

  const existingRank = myRankingsMap.get(otherSpotId) ?? 0;
  const outOfRangeIds: string[] = [];

  for (const player of players) {
    if (player._id === otherSpotId) continue; // Skip the existing partner
    
    const playerRank = myRankingsMap.get(player._id) ?? 0;
    const pairScore = existingRank + playerRank;
    
    if (pairScore < minPairScore || pairScore > maxPairScore) {
      outOfRangeIds.push(player._id);
    }
  }

  return outOfRangeIds;
}