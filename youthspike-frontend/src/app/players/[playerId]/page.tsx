import { QueryRef } from "@apollo/client/react";
import { PreloadQuery } from "@/lib/client";
import { IGetPlayerStats } from "@/types";
import { GET_PLAYER_WITH_STATS } from "@/graphql/player-stats";
import PlayerStatsContainer from "@/components/player-stats/PlayerStatsContainer";

interface IPlayerStatsPageProps {
  params: { playerId: string };
}

export async function PlayerStatsPage({ params }: IPlayerStatsPageProps) {
  const { playerId } = await params;

  return (
    <PreloadQuery query={GET_PLAYER_WITH_STATS} variables={{ playerId }} 
    >
      {(queryRef) => (
          <PlayerStatsContainer
            queryRef={queryRef as QueryRef<{
              getPlayerWithStats: {data: IGetPlayerStats};
            }>}
          />
      )}
    </PreloadQuery>
  );
}

export default PlayerStatsPage;
