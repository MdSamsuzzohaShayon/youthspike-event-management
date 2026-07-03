import { IEventRelatives, IPlayer } from "@/types";
import React from "react";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";

interface PlayerWithRank extends IPlayer {
  rank?: number;
}

interface PlayerListProps {
  players: PlayerWithRank[];
  events: IEventRelatives[];
}

function PlayerList({ players }: PlayerListProps) {
  const hasRank = players.length > 0 && players[0].rank != null;

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
              <tr
                key={player._id}
                className="border-b border-gray-800 transition-colors hover:bg-gray-800/70"
              >
                {/* Rank */}
                {hasRank && (
                  <td className="px-4 py-3 text-center align-middle">
                    <span className="font-semibold text-gray-300">
                      {player.rank ?? index + 1}
                    </span>
                  </td>
                )}

                {/* Player */}
                <td
                  className={`px-4 py-3 ${
                    !hasRank
                      ? "sticky left-0 bg-gray-900 lg:static"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {!hasRank && (
                      <span className="w-5 flex-shrink-0 text-center text-xs font-medium text-gray-400">
                        {index + 1}
                      </span>
                    )}

                    <Link
                      href={`/players/${player._id}`}
                      className="flex items-center gap-3 min-w-0 group w-full"
                    >
                      <div className="flex-shrink-0">
                        {player.profile ? (
                          <CldImage
                            alt={`${player.firstName} ${player.lastName ?? ""}`}
                            width={40}
                            height={40}
                            crop="fill"
                            className="h-9 w-9 rounded-lg object-cover sm:h-10 sm:w-10"
                            src={player.profile}
                          />
                        ) : (
                          <TextImg
                            fullText={`${player.firstName} ${player.lastName ?? ""}`}
                            className="h-9 w-9 rounded-lg sm:h-10 sm:w-10"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium capitalize transition-colors group-hover:text-yellow-400">
                          {player.firstName}{" "}
                          {player.lastName && player.lastName}
                        </p>
                      </div>
                    </Link>
                  </div>
                </td>

                {/* Username */}
                <td className="px-4 py-3">
                  <span className="block truncate font-mono text-xs text-gray-400 sm:text-sm">
                    @{player.username}
                  </span>
                </td>
              </tr>
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