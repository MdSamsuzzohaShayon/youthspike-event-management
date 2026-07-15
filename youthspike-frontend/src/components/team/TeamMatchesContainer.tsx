// components/team/TeamMatchesContainer.tsx
"use client";

import { useMemo } from "react";
import { useReadQuery } from "@apollo/client/react";
import { QueryRef } from "@apollo/client/react";
import { IGetTeamMatchesResponse, IMatch, ITeam, ITeamCaptain } from "@/types";
import MatchList from "@/components/match/MatchList";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FRONTEND_URL } from "@/utils/keys";
import { useLdoId } from "@/lib/LdoProvider";
import TeamNavigation from "./TeamNavigation";

interface TeamMatchesContainerProps {
  queryRef: QueryRef<{ getTeamMatches: IGetTeamMatchesResponse }>;
  teamId: string;
}

function TeamMatchesContainer({ queryRef, teamId }: TeamMatchesContainerProps) {
  const { data } = useReadQuery(queryRef);
  const pathname = usePathname();
  const { ldoIdUrl } = useLdoId();

  if (!data?.getTeamMatches?.data) {
    return <div>Team not found</div>;
  }

  const { team, matches, nets, rounds, oponents, events } =
    data.getTeamMatches.data;

  const teamMap = useMemo(() => {
    return new Map<string, ITeam>(oponents.map((t) => [t._id, t]));
  }, [oponents]);

  const sortedMatches = useMemo(() => {
    const sortedMatches = [...matches].sort(
      (a: IMatch, b: IMatch) => Number(a.completed) - Number(b.completed)
    );

    const matchWithTeam = [];
    for (let i = 0; i < sortedMatches.length; i++) {
      const match = structuredClone(sortedMatches[i]);
      match.teamA = teamMap.get(String(match.teamA)) as ITeamCaptain;
      match.teamB = teamMap.get(String(match.teamB)) as ITeamCaptain;
      matchWithTeam.push(match);
    }

    return matchWithTeam;
  }, [matches, teamMap]);

  if (!team) {
    return <div>Team not found</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="header">
        {/* Navigation */}
        <TeamNavigation events={events} ldoIdUrl={ldoIdUrl} team={team} totalPlayers={team?.players?.length || 0} />
      </div>

      {/* Page Content */}
      <div >
        <MatchList matchList={sortedMatches} nets={nets} rounds={rounds} />
      </div>
    </div>
  );
}





export default TeamMatchesContainer;
