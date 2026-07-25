import { IBadge, IEventRelatives, IPlayer, IPlayerRank } from "@/types";
import React from "react";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";
import PlayerRaw from "./PlayerRaw";



interface PlayerListProps {
  players: IPlayerRank[] | IPlayer[];
  events: IEventRelatives[];
  badgeMap: Map<string, IBadge>;
}

function PlayerList({ players, badgeMap }: PlayerListProps) {
  const first = players[0];
  const hasRank = first != null && "rank" in first && first.rank != null;

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-900 shadow-lg">
        <table className="w-full min-w-[520px] lg:min-w-full table-auto text-left text-sm text-gray-200 border-collapse">
          {/* Header */}
          <thead className="sticky top-0 z-20">
            <tr className="bg-yellow-logo text-black">
              {hasRank && (
                <th className="w-16 px-4 py-3 text-center font-semibold whitespace-nowrap">
                  Rank
                </th>
              )}

              <th
                className={`px-4 py-3 font-semibold whitespace-nowrap ${
                  !hasRank
                    ? "sticky left-0 z-30 bg-yellow-logo lg:static"
                    : ""
                }`}
              >
                Player
              </th>

              <th className="w-40 px-4 py-3 font-semibold whitespace-nowrap">
                Username
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {players.map((player, index) => (
              <PlayerRaw player={player} index={index} hasRank={hasRank} key={player._id} badge={player.badge ? badgeMap.get(String(player.badge)) : null} />
            ))}
          </tbody>
        </table>

        {players.length === 0 && (
          <div className="py-10 text-center text-gray-400">
            No players found.
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerList;