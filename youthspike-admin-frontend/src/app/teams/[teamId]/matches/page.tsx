// app/teams/[teamId]/matches/page.tsx
import React, { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import { QueryRef } from "@apollo/client/react";
import Loader from "@/components/elements/Loader";
import { IGetTeamMatchesResponse } from "@/types";
import { GET_TEAM_MATCHES } from "@/graphql/teams";
import TeamMatchesContainer from "@/components/teams/TeamMatchesContainer";

interface ITeamMatchesPageProps {
  params: Promise<{ teamId: string }>;
}

async function TeamMatchesPage({ params }: ITeamMatchesPageProps) {
  const { teamId } = await params;

  return (
    <PreloadQuery query={GET_TEAM_MATCHES} variables={{ teamId }}>
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
