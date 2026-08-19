import { IBadge, IEventRelatives, IPlayer, IPlayerRank } from "@/types";
import React, { useMemo } from "react";
import RankPlayerRow from "./RankPlayerRow";

interface PlayerListProps {
  players: IPlayerRank[] | IPlayer[];
  events?: IEventRelatives[];
  badgeMap: Map<string, IBadge>;
}

function PlayerList({ players, events = [], badgeMap }: PlayerListProps) {
  const hasRank = useMemo(() => {
    const first = players[0];
    return first != null && "rank" in first && first.rank != null;
  }, [players]);

  return (
    <div className="playerList w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <div className="min-w-[640px] w-full">
          <div className="relative w-full">
            <table className="w-full text-left text-sm text-gray-300 bg-gray-900">
              {/* Header */}
              <thead>
                <tr className="bg-yellow-logo text-black font-semibold">
                  <th className={`
                    py-3 px-3 md:py-3 md:px-3 whitespace-nowrap
                    sticky left-0 top-0 shadow-md z-20 bg-yellow-logo min-w-[140px] max-w-[140px] md:min-w-[240px] md:max-w-[240px]
                  `}>
                    Player
                  </th>

                  <th className="py-3 px-4 whitespace-nowrap min-w-[160px]">
                    Username
                  </th>

                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[140px]">
                    Badge
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {players.map((player, index) => (
                  <RankPlayerRow 
                    player={player} 
                    index={index} 
                    hasRank={hasRank} 
                    key={player._id} 
                    badge={player.badge ? badgeMap.get(String(player.badge)) : null} 
                  />
                ))}
              </tbody>
            </table>

            {players.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm">
                No players found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerList;