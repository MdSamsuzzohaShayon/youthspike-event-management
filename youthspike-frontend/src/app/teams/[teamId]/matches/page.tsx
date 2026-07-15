// app/teams/[teamId]/matches/page.tsx
import React, { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import { QueryRef } from "@apollo/client/react";
import Loader from "@/components/elements/Loader";
import { GET_TEAM_MATCHES } from "@/graphql/team";
import TeamMatchesContainer from "@/components/team/TeamMatchesContainer";
import { IGetTeamMatchesResponse, TParams } from "@/types";
import { CURRENT_EVENT_ID } from "@/utils/constant";

interface ITeamMatchesPageProps {
  params: TParams;
  searchParams: TParams;
}

async function TeamMatchesPage({ params, searchParams }: ITeamMatchesPageProps) {
  const { teamId } = await params;
  const {cei} = await searchParams;
  // Check if there is an event in the query params



  const variables: {teamId: string, eventIds?: string[]} = {
    teamId,
  };
  if(cei){
    variables.eventIds = [cei];
  }
  return (
    <PreloadQuery query={GET_TEAM_MATCHES} variables={variables}>
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TeamMatchesContainer
            teamId={teamId}
            queryRef={
              queryRef as QueryRef<{
                getTeamMatches: IGetTeamMatchesResponse;
              }>
            }
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}

export default TeamMatchesPage;
