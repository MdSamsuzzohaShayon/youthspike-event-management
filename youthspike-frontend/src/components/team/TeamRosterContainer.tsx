// components/team/TeamRosterContainer.tsx
"use client";

import React, { useMemo } from "react";
import { useReadQuery } from "@apollo/client/react";
import { QueryRef } from "@apollo/client/react";
import {
  IPlayer,
  IMatch,
  IAllStats,
  IGetTeamRosterResponse,
  ITeam,
} from "@/types";
import PlayerStandings from "@/components/player/PlayerStandings";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";
import { usePathname } from "next/navigation";
import TeamNavigation from "./TeamNavigation";
import { useLdoId } from "@/lib/LdoProvider";

interface TeamRosterContainerProps {
  queryRef: QueryRef<{ getTeamRoster: IGetTeamRosterResponse }>;
  teamId: string;
}

function TeamRosterContainer({ queryRef, teamId }: TeamRosterContainerProps) {
  const { data } = useReadQuery(queryRef);
  const {ldoIdUrl} = useLdoId();

  if (!data?.getTeamRoster?.data) {
    return <div>Team not found</div>;
  }

  const { team, players, rankings, statsOfPlayer, event } = data.getTeamRoster.data;

  

  const playerStatsMap = useMemo(
    () =>
      new Map(statsOfPlayer.map((ps: IAllStats) => [ps.playerId, ps.stats])),
    [statsOfPlayer]
  );

  const playerList = useMemo(() => {
    const rankingIds = new Set<string>(rankings.map((r: any) => r.player));

    return players
      .filter((p: IPlayer) => rankingIds.has(p._id))
      .map((p: IPlayer) => ({
        ...p,
        teams: [team],
      }));
  }, [players, rankings, team]);

  if (!team) {
    return <div>Team not found</div>;
  }

  const pathname = usePathname();



  return (
    <div className="min-h-screen bg-gray-900 pb-4">
      {/* Header Section */}
      <div className="header bg-gray-800 rounded-xl mb-4">
        {/* Compact Header */}
        <div className="border-b border-yellow-500/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamLogo team={team} />
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate leading-tight">
                  {team?.name || "Loading..."}
                </h1>
                {/* <p className="text-xs text-gray-400 truncate leading-tight">
                  {event?.name || "Loading..."}
                </p> */}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatItem label="Players" value={playerList?.length || 0} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <TeamNavigation eventId={event?._id} ldoIdUrl={ldoIdUrl} pathname={pathname} team={team} />
      </div>

      {/* Page Content */}
      <div className="min-h-screen">
        <PlayerStandings
          playerStatsMap={playerStatsMap}
          matchList={team.matches as IMatch[]}
          playerList={playerList}
          teamRank
        />
      </div>
    </div>
  );
}

const TeamLogo = ({ team }: { team: ITeam }) =>
  team?.logo ? (
    <CldImage
      alt={team.name}
      width={32}
      height={32}
      src={team.logo}
      className="w-8 h-8 rounded-lg border border-yellow-500/30 object-cover object-center flex-shrink-0"
      crop="fit"
    />
  ) : (
    <TextImg
      className="w-8 h-8 rounded-lg border border-yellow-500/30 flex-shrink-0"
      fullText={team?.name || ""}
      txtCls="text-sm font-bold"
    />
  );

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <div className="text-right">
    <div className="text-xs text-gray-400">{label}</div>
    <div className="text-white font-bold text-sm">{value}</div>
  </div>
);



export default TeamRosterContainer;
