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
      <div className="w-full">
        <div className="relative w-full bg-gray-900 text-gray-300 text-sm rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center bg-yellow-logo text-black font-semibold border-b border-gray-800/30 py-2 px-3 md:py-3 md:px-4">
            {hasRank && (
              <div className="w-10 md:w-12 text-center whitespace-nowrap">
                Rank
              </div>
            )}
            <div className="flex-grow pl-2 md:pl-4 whitespace-nowrap">
              Player
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col">
            {players.map((player, index) => (
              <RankPlayerRow
                player={player}
                index={index}
                hasRank={hasRank}
                key={player._id}
                badge={player.badge ? badgeMap.get(String(player.badge)) : null}
              />
            ))}
          </div>

          {players.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">
              No players found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerList;