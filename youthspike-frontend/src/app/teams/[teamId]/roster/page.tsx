// app/teams/[teamId]/roster/page.tsx
import React, { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import { QueryRef } from "@apollo/client/react";
import Loader from "@/components/elements/Loader";
import TeamRosterContainer from "@/components/team/TeamRosterContainer";
import { IGetTeamRosterResponse, ITeam } from "@/types";
import { GET_TEAM_ROSTER } from "@/graphql/team";

interface TeamRosterPageProps {
  params: Promise<{ teamId: string }>;
}

async function TeamRosterPage({ params }: TeamRosterPageProps) {
  const { teamId } = await params;

  return (
    <PreloadQuery query={GET_TEAM_ROSTER} variables={{ teamId }}>
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TeamRosterContainer
            teamId={teamId}
            queryRef={
              queryRef as QueryRef<{
                getTeamRoster: IGetTeamRosterResponse;
              }>
            }
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}

export default TeamRosterPage;
