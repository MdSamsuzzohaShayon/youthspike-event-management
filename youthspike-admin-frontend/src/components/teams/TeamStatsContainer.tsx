// components/team/TeamStatsContainer.tsx
"use client";

import { useMemo } from "react";
import { useReadQuery } from "@apollo/client/react";
import { QueryRef } from "@apollo/client/react";
import {
  IPlayer,
  IMatch,
  IAllStats,
  IFilter,
  IGetTeamStatsResponse,
  EStatsFilter,
  IPlayerStats,
  INetRelatives,
} from "@/types";
import TeamNavigation from "./TeamNavigation";
import { useLdoId } from "@/lib/LdoProvider";
import { useFilterState } from "@/hooks/player-stats/useFilterState";
import useStatsFilterData from "@/hooks/player-stats/useStatsFilterData";
import StatsFilter from "../player-stats/StatsFilter";
import PlayerStandings from "../player/PlayerStandings";
import { filterPlayerStats } from "@/utils/player-stats/playerStatsFilter";

interface TeamStatsContainerProps {
  queryRef: QueryRef<{ getStatsOfPlayers: IGetTeamStatsResponse }>;
  teamId: string;
}

function TeamStatsContainer({ queryRef, teamId }: TeamStatsContainerProps) {
  const { data } = useReadQuery(queryRef);
  const { ldoIdUrl } = useLdoId();


  if (!data?.getStatsOfPlayers?.data) {
    return <div>Team not found</div>;
  }

  const { team, players, statsOfPlayers, events, oponents, matches, nets, rounds } = data.getStatsOfPlayers.data;

  const { filter, handleInputChange, clearAllFilters } = useFilterState();
  const {
    matchOptions,
    vsClubOptions,
    teammateOptions,
    vsPlayerOptions,
    gameOptions,
    eventOptions
  } = useStatsFilterData({
    player: players[0],
    players,
    filter,
    matches: (matches || []) as unknown as IMatch[],
    rounds,
    nets,
    teams: [team, ...oponents],
    events
  });

  const safeNets = nets || [];
  const { netMap, allNetIds } = useMemo(() => {
    const map = new Map<string, INetRelatives>();
    const netIds = new Set<string>();
    for (let i = 0; i < safeNets.length; i++) {
      const n = safeNets[i];
      map.set(n._id, n);
      netIds.add(n._id);
    }
    return { netMap: new Map(nets.map((n) => [n._id, n])), allNetIds: netIds };
  }, [safeNets]);


console.log(events);


  const playerStatsMap: Map<string, IPlayerStats[]> = useMemo(
    () =>{
      const map = new Map<string, IPlayerStats[]>();
      for (const playerStats of statsOfPlayers) {
        const safeMatches = (matches || []) as unknown as IMatch[];
        const safePlayerstats = filterPlayerStats(
          events,
          playerStats.stats,
          filter,
          playerStats.playerId,
          safeMatches ,
          netMap,
          allNetIds,
          team
        );
        map.set(playerStats.playerId, safePlayerstats);
      }
      // return new Map(statsOfPlayers.map((ps: IAllStats) => [ps.playerId, ps.stats]))
      return map;
    }
      ,
    [statsOfPlayers, matches]
  );



  if (!team) {
    return <div>Team not found</div>;
  }


  return (<div className="min-h-screen">
    {/* Animated Background Accent */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    <TeamNavigation events={events} ldoIdUrl={ldoIdUrl} team={team} totalPlayers={players.length} />

    <div className="relative z-10">


      {/* Page Content with Fade-in Animation */}
      <div className="animate-fadeInUp">
        <div className="min-h-screen w-full flex flex-col md:flex-row gap-x-4">

          <div className="left hidden md:block md:w-3/12 bg-gray-900 rounded-xl p-4">
            <StatsFilter
              filter={filter}
              handleInputChange={<K extends keyof IFilter>(
                key: K,
                value: IFilter[K]
              ) => handleInputChange(key as keyof IFilter, value as string)}
              gameOptions={gameOptions}
              matchOptions={matchOptions}
              teammateOptions={teammateOptions}
              vsClubOptions={vsClubOptions}
              vsPlayerOptions={vsPlayerOptions}
              eventOptions={eventOptions}
            />
          </div>

          <div className="right w-full md:w-9/12">
            <PlayerStandings
              playerStatsMap={playerStatsMap}
              matchList={team.matches as IMatch[]}
              playerList={players}
              teamRank
            />
          </div>

        </div>
      </div>
    </div>
  </div>);
}





export default TeamStatsContainer;
