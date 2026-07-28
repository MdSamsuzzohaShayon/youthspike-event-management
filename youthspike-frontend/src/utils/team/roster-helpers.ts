import { EPlayerStatus, IPlayer, IPlayerPartition, IPlayerRank, IPlayerRankingItemExpRel, ITeam, IUserContext, UserRole } from "@/types";
import SessionStorageService from "../SessionStorageService";
import { TEAM } from "../constant";


const EMPTY_PLAYER_PARTITION: IPlayerPartition = { activePlayers: [], inactivePlayers: [] };

/**
 * Splits the roster into "active" (has a ranking entry AND status ACTIVE) and
 * "inactive" (everyone else), tagging every player with the current team id.
 * Pure export function — O(players + rankings) time, O(rankings) extra space.
 */
export function partitionPlayersByRankingAndStatus(
    players: IPlayer[] | undefined,
    rankings: IPlayerRankingItemExpRel[] | undefined,
    teamId: string,
  ): IPlayerPartition {
    if (!players?.length || !rankings?.length) return EMPTY_PLAYER_PARTITION;
  
    const rankedPlayerIds = new Set<string>(rankings.map((ranking) => String(ranking.player)));
  
    const activePlayers: IPlayer[] = [];
    const inactivePlayers: IPlayer[] = [];
  
    for (const player of players) {
      const playerWithTeam: IPlayer = { ...player, teams: [teamId] };
      const isRankedAndActive =
        rankedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE;
  
      if (isRankedAndActive) {
        activePlayers.push(playerWithTeam);
      } else {
        inactivePlayers.push(playerWithTeam);
      }
    }
  
    return { activePlayers, inactivePlayers };
  }
  
  /** Builds a player-id -> rank lookup. Pure export function — O(rankings) time/space. */
  export function buildRankByPlayerId(rankings: IPlayerRankingItemExpRel[] | undefined): Map<string, number> {
    const rankByPlayerId = new Map<string, number>();
    if (!rankings?.length) return rankByPlayerId;
  
    for (const ranking of rankings) {
      rankByPlayerId.set(String(ranking.player), ranking.rank);
    }
    return rankByPlayerId;
  }
  
  /**
   * Attaches a rank to each active player and sorts ascending by rank, pushing
   * unranked players (rank == null) to the end.
   * Pure export function — O(n log n) due to the sort.
   */
  export function attachRanksAndSort(
    activePlayers: IPlayer[],
    rankByPlayerId: Map<string, number>,
  ): IPlayerRank[] {
    const rankedPlayers: IPlayerRank[] = activePlayers.map((player) => ({
      ...player,
      rank: rankByPlayerId.get(player._id) as number,
    }));
  
    return rankedPlayers.sort((a, b) => {
      if (a.rank == null) return 1;
      if (b.rank == null) return -1;
      return a.rank - b.rank;
    });
  }
  
  /** Merges ranking metadata with the raw rankings list, or null when there is none. */
  export function buildPlayerRankingWithRankings<T extends object>(
    playerRanking: T | null | undefined,
    rankings: IPlayerRankingItemExpRel[] | undefined,
  ): (T & { rankings: IPlayerRankingItemExpRel[] | undefined }) | null {
    if (!playerRanking) return null;
    return { ...playerRanking, rankings };
  }
  
  /** Only a team's captain, co-captain, a director, or an admin may change its ranking. */
  export function canUserChangeTeamRanking(user: IUserContext, team: ITeam): boolean {
    if (!user?.token || !user.info) return false;
    const { role } = user.info;
  
    if (role === UserRole.public || role === UserRole.player) return false;
    if (role === UserRole.captain && user.info.captainplayer !== team.captain) return false;
    if (role === UserRole.co_captain && user.info.cocaptainplayer !== team.cocaptain) return false;
  
    return true;
  }
  
  /** Best-effort persistence — a storage failure (e.g. private browsing) should never break the page. */
  export function persistCurrentTeamId(teamId: string): void {
    try {
      SessionStorageService.setItem(TEAM, teamId);
    } catch (error) {
      console.error('Failed to persist current team to session storage:', error);
    }
  }
  
  export function clearPersistedTeamId(): void {
    try {
      SessionStorageService.removeItem(TEAM);
    } catch (error) {
      console.error('Failed to clear current team from session storage:', error);
    }
  }
  