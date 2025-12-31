/*
import { notFound } from 'next/navigation';
import TeamStandingsMain from '@/components/teams/TeamStandingsMain';
import { getTeamStandings } from './_fetch/teamstanding';
import { IGroup, IMatchExpRel, INetRelatives, IRoundRelatives, ITeam, TParams } from '@/types';

interface ITeamStandingsPageProps {
  params: TParams;
}



export default async function TeamStandingsPage({ params }: ITeamStandingsPageProps) {
  const pathParams = await params;

  const eventData = await getTeamStandings(pathParams.eventId);

  if (!eventData) {
    notFound();
  }

  const { event, matches, teams, nets, rounds, groups } = eventData;

  const teamMap = new Map(teams.map((t: ITeam) => [t._id, t]));
  const roundMap = new Map<string, IRoundRelatives>(rounds.map((r: IRoundRelatives) => [r._id, r]));
  const netMap = new Map<string, INetRelatives>(nets.map((n: INetRelatives) => [n._id, n]));

  const matchList = matches.map((m: IMatchExpRel) => {
    const matchObj = { ...m };

    // @ts-ignore
    matchObj.rounds = m.rounds.map((roundId) => roundMap.get(roundId)).filter(Boolean);
    // @ts-ignore
    matchObj.nets = m.nets.map((netId) => netMap.get(netId)).filter(Boolean);

    if (teamMap.has(m.teamA)) {
      // @ts-ignore
      matchObj.teamA = teamMap.get(m.teamA);
    }
    if (teamMap.has(m.teamB)) {
      // @ts-ignore
      matchObj.teamB = teamMap.get(m.teamB);
    }

    return matchObj;
  });


  const currEvent = structuredClone(event);
  currEvent.matches = matchList;
  currEvent.teams = teams;
  currEvent.groups = groups;

  return (
    <div className='animate-fade-in'>
    <TeamStandingsMain eventData={currEvent} />
    </div>
  );
}
*/


// =========================
// app/events/[eventId]/teams/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";
import { ISearchLimitFilter, ISearchTeamResponse, ITeamFilter } from "@/types";
import { SEARCH_TEAMS } from "@/graphql/teams";
import TeamStandingsContainer from "@/components/teams/TeamStandingsContainer";



interface ITeamStandingsPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ITeamFilter>;
}

export default async function TeamStandingsPage({
  params,
  searchParams,
}: ITeamStandingsPageProps) {
  const { eventId } = await params;
  const {
    search = "",
    division = "",
    group = "",
  } = await searchParams;

  const initialFilter: Partial<ISearchLimitFilter> = {
    limit: 30,
    offset: 0,
    search,
    division,
    group,
  };

  return (
    <PreloadQuery
      query={SEARCH_TEAMS}
      variables={{ eventId, filter: initialFilter }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TeamStandingsContainer
            queryRef={
              queryRef as QueryRef<{ searchTeams: ISearchTeamResponse }>
            }
            eventId={eventId}
            initialSearchParams={{ search, division, group }}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}

