import {
  EPlayerStatType,
  EStatsFilter,
  IFilter,
  IMatch,
  INetRelatives,
  IOption,
  IPlayer,
  IRoundRelatives,
  IStatsFilterProps,
  ITeam,
} from "@/types";
import {
  createNetMapByMatch,
  createNetMapByRound,
  createRoundMapByMatch,
} from "@/utils/match/mapByMatch";
import {
  formatMatchLabel,
  isPlayerParticipatingInNet,
} from "@/utils/player-stats/formatDescription";
import SessionStorageService from "@/utils/SessionStorageService";
import { useMemo } from "react";

interface IStatsFilterDataProps {
  player: IPlayer;
  players: IPlayer[];
  filter: Partial<Record<EStatsFilter, string | string[]>>;
  matches: IMatch[];
  rounds: IRoundRelatives[];
  nets: INetRelatives[];
  teams: ITeam[];
}

/**
 * Hook that encapsulates all derived data and expensive computations.
 * Keeps the component lean and the logic testable.
 */
function useStatsFilterData({
  player,
  players,
  filter,
  matches,
  rounds,
  nets,
  teams,
}: IStatsFilterDataProps) {
  // base maps memoized to O(n) build cost once per dependency change
  const {
    teamMap,
    matchMap,
    playerMap,
    netMap,
    roundMapByMatch,
    netMapByMatch,
    netMapByRound,
  } = useMemo(() => {
    const teamMap = new Map<string, ITeam>();

    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      if (t && t?._id) {
        teamMap.set(String(t._id), t);
      }
    }

    const matchMap = new Map<string, IMatch>(
      matches.map((m) => [String(m?._id), m])
    );
    const playerMap = new Map<string, IPlayer>(
      players.map((p) => [String(p?._id), p])
    );
    const netMap = new Map<string, INetRelatives>(
      nets.map((n) => [String(n?._id), n])
    );
    const roundMapByMatch = createRoundMapByMatch(rounds);
    const netMapByMatch = createNetMapByMatch(nets);
    const netMapByRound = createNetMapByRound(nets);

    return {
      teamMap,
      matchMap,
      playerMap,
      netMap,
      roundMapByMatch,
      netMapByMatch,
      netMapByRound,
    };
  }, [teams, matches, players, nets, rounds]);

  // 1) Filter matches by date range (pure, readable, no mutation)
  const availableMatches = useMemo(() => {
    const startTs = filter[EStatsFilter.START_DATE]
      ? new Date(String(filter[EStatsFilter.START_DATE])).getTime()
      : null;
    const endTs = filter[EStatsFilter.END_DATE]
      ? new Date(String(filter[EStatsFilter.END_DATE])).getTime()
      : null;

    return matches.filter((m) => {
      const t = new Date(m.date).getTime();
      if (startTs != null && t < startTs) return false;
      if (endTs != null && t > endTs) return false;
      return true;
    });
  }, [matches, filter]);

  // 2) Match options for the UI (formatted labels)
  const matchOptions = useMemo(() => {
    const options = availableMatches.map((m, idx) => ({
      id: idx + 1,
      value: m._id,
      text: formatMatchLabel(
        m,
        teamMap.get(String(m.teamA)) ?? null,
        teamMap.get(String(m.teamB)) ?? null
      ),
    }));
    // SessionStorageService.setItem(EStatsFilter.MATCH, JSON.stringify(options));
    return options;
  }, [availableMatches, teamMap]);

  // 3) Clubs (VS clubs) derived from either selected matches or all matches
  const vsClubOptions = useMemo(() => {
    // decide which match ids are in scope
    const selectedMatchIds =
      filter[EStatsFilter.MATCH] && filter[EStatsFilter.MATCH].length > 0
        ? filter[EStatsFilter.MATCH]
        : availableMatches.map((m) => m._id);

    const clubSet = new Map<string, ITeam>();
    for (const matchId of selectedMatchIds) {
      const match = matchMap.get(String(matchId));
      if (!match) continue;

      const teamA = teamMap.get(String(match.teamA));
      const teamB = teamMap.get(String(match.teamB));

      if (teamA && !(player.teams as string[])?.includes(String(teamA._id)))
        clubSet.set(String(teamA._id), teamA);
      if (teamB && !(player.teams as string[])?.includes(String(teamB._id)))
        clubSet.set(String(teamB._id), teamB);
    }

    return Array.from(clubSet.values()).map((c, i) => ({
      id: i + 1,
      value: c._id,
      text: c.name,
    }));
  }, [filter, availableMatches, matchMap, teamMap, player.teams]);

  // 4) Teammates — players who share the player's primary team (no mutation)
  const teammateOptions = useMemo(() => {
    const primaryTeamId = player.teams?.[0];
    if (!primaryTeamId) return [];

    const teammates = players.filter(
      (p) =>
        p._id !== player._id &&
        (p.teams as string[])?.includes(primaryTeamId as string)
    );
    return teammates.map((p, i) => ({
      id: i + 1,
      value: p._id,
      text: `${p.firstName} ${p.lastName}`,
    }));
  }, [player._id, player.teams, players]);

  // 5) Vs players (opponents) — optimized: dedupe with Set, avoid nested heavy loops
  const vsPlayerOptions = useMemo(() => {
    // Determine relevant nets (either selected by game, or nets under selected matches, or all nets)
    const relevantNetIds = new Set<string>();

    if (filter[EStatsFilter.GAME] && filter[EStatsFilter.GAME].length > 0) {
      (filter[EStatsFilter.GAME] as string[]).forEach((id) =>
        relevantNetIds.add(id)
      );
    } else if (
      filter[EStatsFilter.MATCH] &&
      filter[EStatsFilter.MATCH].length > 0
    ) {
      for (const matchId of filter[EStatsFilter.MATCH]) {
        const netsForMatch = netMapByMatch.get(matchId) || [];
        for (const n of netsForMatch) relevantNetIds.add(n._id);
      }
    } else {
      for (const n of nets) relevantNetIds.add(n._id);
    }

    const opponentSet = new Map<string, IPlayer>();
    for (const netId of Array.from(relevantNetIds)) {
      const net = netMap.get(String(netId));
      if (!net) continue;
      if (!isPlayerParticipatingInNet(net, player._id)) continue;

      // collect all participants from the net and exclude the current player
      const participantIds = [
        net.teamAPlayerA,
        net.teamAPlayerB,
        net.teamBPlayerA,
        net.teamBPlayerB,
      ].filter(Boolean) as string[];

      for (const pid of participantIds) {
        if (pid === player._id) continue;
        const p = playerMap.get(String(pid));
        if (p) opponentSet.set(String(p._id), p);
      }
    }

    return Array.from(opponentSet.values()).map((p, i) => ({
      id: i + 1,
      value: p._id,
      text: `${p.firstName} ${p.lastName}`,
    }));
  }, [filter, nets, netMap, netMapByMatch, player._id, playerMap]);

  // 6) Game options — nets grouped by rounds under selected matches where the player participated
  const gameOptions = useMemo(() => {
    if (!filter[EStatsFilter.MATCH] || filter[EStatsFilter.MATCH].length === 0)
      return [];

    const options: IOption[] = [];
    for (const matchId of filter[EStatsFilter.MATCH]) {
      const roundsForMatch = roundMapByMatch.get(matchId) || [];
      for (const round of roundsForMatch) {
        const netsForRound = netMapByRound.get(round._id) || [];
        for (const net of netsForRound) {
          if (!isPlayerParticipatingInNet(net, player._id)) continue;
          const playerA1 = playerMap.get(String(net.teamAPlayerA));
          const playerA2 = playerMap.get(String(net.teamAPlayerB));
          const playerB1 = playerMap.get(String(net.teamBPlayerA));
          const playerB2 = playerMap.get(String(net.teamBPlayerB));

          const label = `Round ${round.num} - ${
            playerA1?.firstName ?? "N/A"
          } & ${playerA2?.firstName ?? "N/A"} vs ${
            playerB1?.firstName ?? "N/A"
          } & ${playerB2?.firstName ?? "N/A"}`;

          options.push({
            id: parseInt(`${round.num}${net.num}`, 10) || options.length + 1,
            value: net._id,
            text: label,
          });
        }
      }
    }

    return options;
  }, [filter, roundMapByMatch, netMapByRound, player._id, playerMap]);

  return {
    matchOptions,
    vsClubOptions,
    teammateOptions,
    vsPlayerOptions,
    gameOptions,
  };
}

export default useStatsFilterData;
