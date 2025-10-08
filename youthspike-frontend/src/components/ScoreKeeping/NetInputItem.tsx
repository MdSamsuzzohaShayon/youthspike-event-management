import { INetRelatives, IPlayer, ITeam } from "@/types";
import { CldImage } from "next-cloudinary";
import React from "react";
import TextImg from "../elements/TextImg";

interface INetInputItemProps {
  net: INetRelatives | null;
  playerMap: Map<string, IPlayer>;
  teamA: ITeam;
  teamB: ITeam;
  onNetChange?: (e: React.SyntheticEvent, netNum: number) => void;
  isCurrentNet?: boolean;
}

function NetInputItem({
  net,
  playerMap,
  teamA,
  teamB,
  onNetChange,
  isCurrentNet = false,
}: INetInputItemProps) {
  if (!net) {
    return (
      <div className="p-3 bg-gray-800 rounded-lg text-center text-gray-400">
        Select A Net
      </div>
    );
  }

  // Get players with memoization removed for simplicity, can add back if needed
  const teamAPlayerA = net?.teamAPlayerA
    ? playerMap.get(net.teamAPlayerA)
    : null;
  const teamAPlayerB = net?.teamAPlayerB
    ? playerMap.get(net.teamAPlayerB)
    : null;
  const teamBPlayerA = net?.teamBPlayerA
    ? playerMap.get(net.teamBPlayerA)
    : null;
  const teamBPlayerB = net?.teamBPlayerB
    ? playerMap.get(net.teamBPlayerB)
    : null;

  const PlayerAvatar = ({
    player,
    size = 6,
  }: {
    player: IPlayer | null;
    size?: number;
  }) => {
    if (!player) return null;

    return (
      <div
        className={`w-${size} h-${size} rounded-full bg-gray-600 flex-shrink-0 overflow-hidden`}
      >
        {player?.profile ? (
          <CldImage
            src={player.profile}
            height={size * 4}
            width={size * 4}
            className={`w-${size} h-${size} object-cover`}
            alt={player.firstName}
            crop="scale"
          />
        ) : (
          <TextImg
            fullText={player.firstName}
            className={`w-${size} h-${size} text-xs`}
          />
        )}
      </div>
    );
  };

  const PlayerName = ({ player }: { player: IPlayer | null }) => {
    if (!player) return null;

    return (
      <div className="text-white text-xs font-medium truncate">
        {player.firstName.charAt(0)}. {player.lastName}
      </div>
    );
  };

  return (
    <div
      className={`
        border-2 rounded-lg p-2 transition-all duration-200 cursor-pointer min-w-0
        ${
          isCurrentNet
            ? "border-yellow-400 bg-yellow-400/10 shadow-lg"
            : "border-gray-600 hover:border-gray-400 hover:bg-gray-800"
        }
      `}
      onClick={(e) => onNetChange && onNetChange(e, net.num)}
    >
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`font-bold text-sm ${
              isCurrentNet ? "text-yellow-400" : "text-white"
            }`}
          >
            Net {net.num}
          </span>
          {isCurrentNet && (
            <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-semibold">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Teams - Horizontal Layout for Mobile */}
      <div className="space-y-2">
        {/* Team A */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {teamAPlayerA && <PlayerAvatar player={teamAPlayerA} size={6} />}
              {teamAPlayerB && <PlayerAvatar player={teamAPlayerB} size={6} />}
            </div>
            <div className="min-w-0 flex-1">
              {teamA.logo ? (
                <CldImage
                  src={teamA.logo}
                  height={50}
                  width={50}
                  alt={teamA.name}
                  className="w-6 h-6 rounded-full"
                  crop="scale"
                />
              ) : (
                <TextImg
                  className="w-6 h-6 rounded-full"
                  fullText={teamA.name}
                />
              )}
              <div className="flex flex-col gap-0.5">
                {teamAPlayerA && <PlayerName player={teamAPlayerA} />}
                {teamAPlayerB && <PlayerName player={teamAPlayerB} />}
              </div>
            </div>
          </div>
        </div>

        {/* VS Separator */}
        <div className="flex items-center justify-center">
          <div className="h-px bg-gray-600 flex-1" />
          <span className="px-2 text-gray-400 text-xs font-bold">VS</span>
          <div className="h-px bg-gray-600 flex-1" />
        </div>

        {/* Team B */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="min-w-0 flex-1 text-right">
              <div className="text-white text-xs font-semibold truncate">
                {teamB.logo ? (
                  <CldImage
                    src={teamB.logo}
                    height={50}
                    width={50}
                    alt={teamB.name}
                    className="w-6 h-6 rounded-full"
                    crop="scale"
                  />
                ) : (
                  <TextImg
                    className="w-6 h-6 rounded-full"
                    fullText={teamB.name}
                  />
                )}
              </div>
              <div className="flex flex-col gap-0.5 items-end">
                {teamBPlayerA && <PlayerName player={teamBPlayerA} />}
                {teamBPlayerB && <PlayerName player={teamBPlayerB} />}
              </div>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
              {teamBPlayerA && <PlayerAvatar player={teamBPlayerA} size={6} />}
              {teamBPlayerB && <PlayerAvatar player={teamBPlayerB} size={6} />}
            </div>
          </div>
        </div>
      </div>

      {/* Score if available - Compact */}
      {(net.teamAScore !== null || net.teamBScore !== null) && (
        <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-600">
          <span className="text-white text-sm font-bold">
            {net.teamAScore || 0}
          </span>
          <span className="text-gray-400 text-xs">-</span>
          <span className="text-white text-sm font-bold">
            {net.teamBScore || 0}
          </span>
        </div>
      )}
    </div>
  );
}

export default NetInputItem;
