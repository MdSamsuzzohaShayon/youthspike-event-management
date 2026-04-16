// app/teams/[teamId]/roster/page.tsx
import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import { QueryRef } from "@apollo/client/react";
import Loader from "@/components/elements/Loader";
import { IGetTeamStatsResponse } from "@/types";
import { STATS_OF_PLAYERS } from "@/graphql/player-stats";
import TeamStatsContainer from "@/components/teams/TeamStatsContainer";

interface TeamStatsPageProps {
  params: Promise<{ teamId: string }>;
}

async function TeamStatsPage({ params }: TeamStatsPageProps) {
  const { teamId } = await params;

  return (
    <PreloadQuery query={STATS_OF_PLAYERS} variables={{ teamId }}>
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TeamStatsContainer
            teamId={teamId}
            queryRef={
              queryRef as QueryRef<{
                getStatsOfPlayers: IGetTeamStatsResponse;
              }>
            }
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}

export default TeamStatsPage;
