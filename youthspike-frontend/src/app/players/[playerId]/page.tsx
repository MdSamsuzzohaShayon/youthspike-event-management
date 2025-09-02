import { Suspense } from "react";
import { QueryRef } from "@apollo/client";
import PlayerStatsMain from "@/components/player-stats/PlayerStatsMain";
import Loader from "@/components/elements/Loader";
import { PreloadQuery } from "@/lib/client";
import { IGetPlayerStats } from "@/types";
import { GET_PLAYER_WITH_STATS } from "@/graphql/player-stats";

interface IPlayerStatsPageProps {
  params: { playerId: string };
}

export async function PlayerStatsPage({ params }: IPlayerStatsPageProps) {
  const { playerId } = await params;

  return (
    <PreloadQuery query={GET_PLAYER_WITH_STATS} variables={{ playerId }} 
    // pollInterval={90000} // 90 seconds = 1.5 minutes
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <PlayerStatsMain
            queryRef={queryRef as QueryRef<{
              getPlayerWithStats: {data: IGetPlayerStats};
            }>}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}

export default PlayerStatsPage;
