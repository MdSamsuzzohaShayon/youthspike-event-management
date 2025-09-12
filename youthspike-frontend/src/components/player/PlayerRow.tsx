import React from "react";
import Image from "next/image";
import {
  IPlayerRecord,
  IPlayerStats,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { aggregatePlayerStats } from "@/utils/helper";

interface IPlayerRowProps {
  player: IPlayerRecord;
  index: number;
  playerStats: IPlayerStats[];
  teamRank?: boolean;
  team?: ITeam | null;
}

function PlayerRow({
  player,
  index,
  playerStats,
  teamRank,
  team,
}: IPlayerRowProps) {
  // Aggregate the stats - simple sum of all numeric fields
  const aggregatedStats = aggregatePlayerStats(playerStats);
  return (
    <tr className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all">
      <td className="py-2 px-3 sticky left-0 bg-inherit min-w-[120px] max-w-[120px] z-10">
        <div className="flex items-start">
          <span className="w-5 text-center font-medium text-sm shrink-0 mt-1">
            {teamRank ? player.rank : index + 1}
          </span>

          <div className="ml-2 flex flex-col w-full">
            {/* Player info container */}
            <div className="flex flex-col">
              {/* Player link (image + name) - Stacked vertically on mobile */}
              <Link
                href={`/players/${player?._id || ""}`}
                className="flex flex-col sm:flex-row sm:items-center"
              >
                <div className="relative w-8 h-8 flex-shrink-0 mx-auto sm:mx-0">
                  {player.profile ? (
                    <CldImage
                      alt={player.firstName}
                      width="32"
                      height="32"
                      className="w-8 h-8 rounded-full object-cover"
                      src={player.profile}
                    />
                  ) : (
                    <Image
                      width={32}
                      height={32}
                      src="/icons/sports-man.svg"
                      alt="Player Avatar"
                      className="svg-white w-8 h-8 rounded-full object-contain bg-gray-600 p-1"
                    />
                  )}
                </div>
                <div className="ml-0 sm:ml-2 min-w-0 text-center sm:text-left mt-1 sm:mt-0">
                  <div className="text-xs font-medium hover:text-yellow-400 transition-colors break-words capitalize">
                    <span className="block sm:inline">{player.firstName}</span>
                    {player.lastName && (
                      <span className="block sm:inline">
                        {" "}
                        {player.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              {team && (
                <Link
                  href={`/`}
                  className="text-xs font-medium hover:text-yellow-400 transition-colors break-words capitalize text-yellow-logo"
                >
                  {team.name}
                </Link>
              )}

              {/* Team link + Captain info - Always below */}
              <div className="mt-1 flex flex-col items-center sm:items-start">
                {player.teams &&
                  player.teams.length > 0 &&
                  typeof player.teams[0] === "object" && (
                    <Link
                      href={`/teams/${(player.teams[0] as ITeam)?._id}`}
                      className="text-yellow-400 text-[10px] uppercase hover:underline truncate max-w-full"
                    >
                      {(player.teams[0] as ITeam).name}
                    </Link>
                  )}
                {player?.captainofteams?.length > 0 && (
                  <div className="text-yellow-400 text-[10px] uppercase">
                    Captain
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </td>

      {/* Serve %  */}
      <td className="py-3 px-4 text-center whitespace-nowrap flex flex-col">
        <span>
          ( {aggregatedStats.serveCompletionCount} /{" "}
          {aggregatedStats.serveOpportunity} )
        </span>
        <span className="font-bold text-xl">
          {aggregatedStats.serveOpportunity > 0
            ? (
                (aggregatedStats.serveCompletionCount /
                  aggregatedStats.serveOpportunity) *
                100
              ).toFixed(1)
            : 0}
          %
        </span>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex flex-col">
          <span>
            ( {aggregatedStats.break} / {aggregatedStats.broken} )
          </span>
          <span className="font-bold text-xl">
            {aggregatedStats.break + aggregatedStats.broken}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap flex flex-col">
        <span>
          ( {aggregatedStats.serveAce} / {aggregatedStats.serveOpportunity} )
        </span>
        <span className="font-bold text-xl">
          {aggregatedStats.serveAce > 0
            ? (
                (aggregatedStats.serveAce / aggregatedStats.serveOpportunity) *
                100
              ).toFixed(1)
            : 0}
          %
        </span>
      </td>

      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="w-full flex flex-col">
          <span>
            ( {aggregatedStats.receivedCount} /{" "}
            {aggregatedStats.receiverOpportunity} )
          </span>
          <span className="font-bold text-xl">
            {aggregatedStats.receiverOpportunity > 0
              ? (
                  (aggregatedStats.receivedCount /
                    aggregatedStats.receiverOpportunity) *
                  100
                ).toFixed(1)
              : 0}
            %
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="w-full flex flex-col">
          <span>
            ({aggregatedStats.cleanHits} / {aggregatedStats.hittingOpportunity})
          </span>
          <span className="font-bold text-xl">
            {aggregatedStats.cleanHits > 0
              ? (
                  (aggregatedStats.cleanHits /
                    aggregatedStats.hittingOpportunity) *
                  100
                ).toFixed(1)
              : 0}
            %
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="w-full flex flex-col">
          <span>
            ( {aggregatedStats.cleanSets} / {aggregatedStats.settingOpportunity}
            )
          </span>
          <span className="font-bold text-xl">
            {aggregatedStats.settingOpportunity > 0
              ? (
                  (aggregatedStats.cleanSets /
                    aggregatedStats.settingOpportunity) *
                  100
                ).toFixed(1)
              : 0}
            %
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="w-full flex flex-col">
          <span>
            ( {aggregatedStats.defensiveConversion} /{" "}
            {aggregatedStats.defensiveOpportunity})
          </span>
          <span className="font-bold text-xl">
            {aggregatedStats.defensiveOpportunity > 0
              ? (
                  (aggregatedStats.defensiveConversion /
                    aggregatedStats.defensiveOpportunity) *
                  100
                ).toFixed(1)
              : 0}
            %
          </span>
        </div>
      </td>
      {/* <td className="py-3 px-4 text-center whitespace-nowrap font-medium">
        {Number.isNaN((player.wins * 100) / (player.numOfGame - player.running))
          ? "0"
          : (player.numOfGame - player.running === 0
              ? 0
              : (player.wins * 100) / (player.numOfGame - player.running)
            ).toFixed(1)}
        %
      </td> */}
    </tr>
  );
}

export default PlayerRow;
