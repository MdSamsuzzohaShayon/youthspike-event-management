// utils/playerStatsFilter.ts
import { IFilter, IMatch, INetRelatives, IPlayerStats } from "@/types";

/**
 * Check if a match is within the selected date range.
 */
export function isMatchInDateRange(
  match: IMatch,
  startDate?: string,
  endDate?: string
): boolean {
  if (!match.date) return true;
  const matchTime = new Date(match.date).getTime();
  const startTime = startDate ? new Date(startDate).getTime() : null;
  const endTime = endDate ? new Date(endDate).getTime() : null;

  if (startTime && matchTime < startTime) return false;
  if (endTime && matchTime > endTime) return false;

  return true;
}

/**
 * Check if a net contains the player and optionally the selected teammate(s).
 */
export function isNetValidForPlayer(
  net: INetRelatives,
  playerId: string,
  filter: Partial<IFilter>
): boolean {
  if (!net) return false;

  // Teammate filter
  if (filter.teammate && filter.teammate.length > 0) {
    const teammateIds = [
      net.teamAPlayerA,
      net.teamAPlayerB,
      net.teamBPlayerA,
      net.teamBPlayerB,
    ];
    if (!filter.teammate.some((tid) => teammateIds.includes(tid))) return false;
  }

  // Club filter (if netId represents club)
  if (filter.club && filter.club.length > 0 && !filter.club.includes(net._id))
    return false;

  // VS Player filter
  if (filter.vsPlayer && filter.vsPlayer.length > 0) {
    const opponentIds =
      net.teamAPlayerA === playerId || net.teamAPlayerB === playerId
        ? [net.teamBPlayerA, net.teamBPlayerB]
        : [net.teamAPlayerA, net.teamAPlayerB];

    if (!opponentIds.some((pid) => filter.vsPlayer?.includes(String(pid)))) return false;
  }

  return true;
}

/**
 * Filter player stats by valid matches and nets.
 */
export function filterPlayerStats(
  playerStats: IPlayerStats[],
  filter: Partial<IFilter>,
  playerId: string,
  matches: IMatch[],
  nets: INetRelatives[]
): IPlayerStats[] {
  const matchMap = new Map(matches.map((m) => [m._id, m]));
  const netMap = new Map(nets.map((n) => [n._id, n]));

  // Determine valid matches
  const selectedMatchIds: string[] = filter.match || matches.map((m) => m._id);
  const validMatchIds = new Set(
    selectedMatchIds.filter((id) => {
      const match = matchMap.get(id);
      return match ? isMatchInDateRange(match, filter.startDate, filter.endDate) : false;
    })
  );

  // Determine valid nets
  const selectedNetIds: string[] = filter.game || nets.map((n) => n._id);
  const validNetIds = new Set(
    selectedNetIds.filter((id) => isNetValidForPlayer(netMap.get(id)!, playerId, filter))
  );

  // Filter player stats in a single pass
  return playerStats.filter((stat) => {
    const statMatchId = typeof stat.match === "string" ? stat.match : stat.match?._id;
    const statNetId = typeof stat.net === "string" ? stat.net : stat.net?._id;

    return (
      statMatchId &&
      validMatchIds.has(statMatchId) &&
      (!validNetIds.size || (statNetId && validNetIds.has(statNetId)))
    );
  });
}
