// app/teams/[teamId]/matches/page.tsx
import React, { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import { QueryRef } from "@apollo/client/react";
import Loader from "@/components/elements/Loader";
import { GET_TEAM_MATCHES } from "@/graphql/team";
import TeamMatchesContainer from "@/components/team/TeamMatchesContainer";
import { IGetTeamMatchesResponse } from "@/types";

interface TeamMatchesPageProps {
  params: Promise<{ teamId: string }>;
}

async function TeamMatchesPage({ params }: TeamMatchesPageProps) {
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
