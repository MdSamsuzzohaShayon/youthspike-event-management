// utils/playerStatsFilter.ts
import {
  EGroupType,
  EStatsFilter,
  IFilter,
  IGroup,
  IGroupRelatives,
  IMatch,
  INetRelatives,
  IPlayerStats,
} from "@/types";

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
  filter: Partial<Record<EStatsFilter, string | string[]>>
): boolean {
  if (!net) return false;

  // Teammate filter
  if (
    filter[EStatsFilter.TEAMMATE] &&
    filter[EStatsFilter.TEAMMATE].length > 0
  ) {
    const teammateIds = [
      net.teamAPlayerA,
      net.teamAPlayerB,
      net.teamBPlayerA,
      net.teamBPlayerB,
    ];
    if (
      !(filter[EStatsFilter.TEAMMATE] as string[]).some((tid) =>
        teammateIds.includes(tid)
      )
    )
      return false;
  }

  // Club filter (if netId represents club)
  if (
    filter[EStatsFilter.CLUB] &&
    filter[EStatsFilter.CLUB].length > 0 &&
    !filter[EStatsFilter.CLUB].includes(net._id)
  )
    return false;


  



  // VS Player filter
  if (
    filter[EStatsFilter.VS_PLAYER] &&
    (filter[EStatsFilter.VS_PLAYER] as string).length > 0
  ) {
    const opponentIds =
      net.teamAPlayerA === playerId || net.teamAPlayerB === playerId
        ? [net.teamBPlayerA, net.teamBPlayerB]
        : [net.teamAPlayerA, net.teamAPlayerB];

    if (
      !opponentIds.some((pid) =>
        filter[EStatsFilter.VS_PLAYER]?.includes(String(pid))
      )
    )
      return false;
  }

  return true;
}

/**
 * Filter player stats by valid matches and nets.
 */
export function filterPlayerStats(
  playerStats: IPlayerStats[],
  filter: Partial<Record<EStatsFilter, string | string[]>>,
  playerId: string,
  matches: IMatch[],
  netMap: Map<string, INetRelatives>,
  allNetIds: Set<string>,
  groups: IGroupRelatives[]
): IPlayerStats[] {
  

  // Check group, group that has conference, groups that does not have
  /*
  const groupIds = new Set<string>();
  const conferenceIds = new Set<string>();
  const nonConferenceIds = new Set<string>();
  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i];
    groupIds.add(group._id);

    if (new RegExp(EGroupType.CONFERENCE, "i").test(group.name)) {
      conferenceIds.add(group._id);
    } else {
      nonConferenceIds.add(group._id);
    }
  }
    */

  // Determine valid matches
  const selectedMatchIds = new Set(filter[EStatsFilter.MATCH] as string[]);
  const validMatchIds = new Set();
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    // Check the match is been selected or not
    if (selectedMatchIds.size > 0 && !selectedMatchIds.has(match._id)) continue;

    // Check the match within date range
    if (filter[EStatsFilter.START_DATE] || filter[EStatsFilter.END_DATE]) {
      const withinRange = isMatchInDateRange(
        match,
        filter[EStatsFilter.START_DATE] as string,
        filter[EStatsFilter.END_DATE] as string
      );
      if (!withinRange) continue;
    }


    // Check groups
    if(filter[EStatsFilter.CONFERENCE] && filter[EStatsFilter.CONFERENCE] !== EGroupType.OVERALL){
      if (filter[EStatsFilter.CONFERENCE] === EGroupType.CONFERENCE) {
        if(!match.group || String(match.group) === "") continue;
      } else if (filter[EStatsFilter.CONFERENCE] === EGroupType.NON_CONFERENCE) {
        if(match.group) continue;
      } 
    }


    validMatchIds.add(match._id);
  }

  // Determine valid nets
  const selectedNetIds: string[] =
    (filter[EStatsFilter.GAME] as string[]) || [...allNetIds];
  const validNetIds = new Set(
    selectedNetIds.filter((id) =>
      isNetValidForPlayer(netMap.get(id)!, playerId, filter)
    )
  );


  // Check vs club is selected or not.



  // Filter player stats in a single pass
  return playerStats.filter((stat) => {
    const statMatchId =
      typeof stat.match === "string" ? stat.match : stat.match?._id;
    const statNetId = typeof stat.net === "string" ? stat.net : stat.net?._id;

    return (
      statMatchId &&
      validMatchIds.has(statMatchId) &&
      (!validNetIds.size || (statNetId && validNetIds.has(statNetId)))
    );
  });
}
