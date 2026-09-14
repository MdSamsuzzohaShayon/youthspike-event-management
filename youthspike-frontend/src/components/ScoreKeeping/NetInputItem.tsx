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
      <div className="p-4 bg-gray-800/50 rounded-xl text-center text-gray-500 text-sm border border-dashed border-gray-700">
        Select A Net
      </div>
    );
  }

  const teamAPlayerA = net?.teamAPlayerA ? playerMap.get(net.teamAPlayerA) : null;
  const teamAPlayerB = net?.teamAPlayerB ? playerMap.get(net.teamAPlayerB) : null;
  const teamBPlayerA = net?.teamBPlayerA ? playerMap.get(net.teamBPlayerA) : null;
  const teamBPlayerB = net?.teamBPlayerB ? playerMap.get(net.teamBPlayerB) : null;

  const hasScore = (net.teamAScore !== null && net.teamAScore !== undefined) || (net.teamBScore !== null && net.teamBScore !== undefined);

  const TeamLogo = ({ team }: { team: ITeam }) => (
    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-gray-600 flex items-center justify-center bg-gray-800 shadow-sm">
      {team?.logo ? (
        <CldImage src={team.logo} height={40} width={40} alt={team.name} className="object-cover w-full h-full" crop="fit" />
      ) : (
        <TextImg className="w-full h-full text-[9px] sm:text-xs" fullText={team.name} />
      )}
    </div>
  );

  const PlayerAvatar = ({ player }: { player: IPlayer | null | undefined }) => {
    if (!player) return <div className="flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gray-700/40 border border-dashed border-gray-600" />;
    return (
      <div className="flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-gray-600 shadow-sm">
        {player?.profile ? (
          <CldImage src={player.profile} height={36} width={36} className="object-cover w-full h-full" alt={player.firstName} crop="fit" />
        ) : (
          <TextImg fullText={player.firstName} className="w-full h-full text-[9px] sm:text-xs" />
        )}
      </div>
    );
  };

  const PlayerName = ({ player, align = "left" }: { player: IPlayer | null | undefined; align?: "left" | "right" }) => {
    if (!player) return null;
    return (
      <div className={`text-gray-200 text-[10px] sm:text-xs font-medium truncate ${align === "right" ? "text-right" : "text-left"}`}>
        {player.firstName.charAt(0)}. {player.lastName}
      </div>
    );
  };

  return (
    <div
      onClick={(e) => onNetChange && onNetChange(e, net.num)}
      className={`
        relative w-full h-full min-h-[120px] flex flex-col rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group
        ${isCurrentNet 
          ? "border-2 border-yellow-400 bg-gradient-to-b from-black to-gray-900 shadow-lg shadow-yellow-500/20" 
          : "border border-gray-700 bg-gradient-to-b from-gray-900 to-black hover:border-gray-500"}
      `}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isCurrentNet ? "border-yellow-400/30" : "border-gray-700/50"}`}>
        <span className={`font-bold text-xs tracking-wider ${isCurrentNet ? "text-yellow-400" : "text-gray-300"}`}>
          NET {net.num}
        </span>
        {isCurrentNet && (
          <span className="text-[9px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
            Live
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col sm:flex-row items-stretch justify-between p-2 gap-1 sm:gap-2">
        
        {/* Team A Section */}
        <div className="flex-1 flex items-center gap-2 min-w-0 pb-1.5 sm:pb-0 sm:pr-2 border-b sm:border-b-0 sm:border-r border-gray-700/50">
          <TeamLogo team={teamA} />
          <div className="flex items-center gap-1 sm:gap-1.5">
            <PlayerAvatar player={teamAPlayerA} />
            <PlayerAvatar player={teamAPlayerB} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <PlayerName player={teamAPlayerA} align="left" />
            <PlayerName player={teamAPlayerB} align="left" />
          </div>
        </div>

        {/* Score / VS Section (Acts as a divider on mobile) */}
        <div className="flex sm:flex-col items-center justify-center py-1.5 sm:py-2 bg-black/40 sm:bg-transparent border-y sm:border-y-0 sm:border-x border-gray-700/50">
          {hasScore ? (
            <div className="flex sm:flex-col items-center justify-center text-white font-extrabold text-base sm:text-lg">
              <span className={isCurrentNet ? "text-yellow-400" : "text-white"}>{net.teamAScore || 0}</span>
              <span className="text-gray-500 text-xs px-2 sm:px-0">-</span>
              <span className={isCurrentNet ? "text-yellow-400" : "text-white"}>{net.teamBScore || 0}</span>
            </div>
          ) : (
            <span className="text-gray-500 font-bold text-sm tracking-widest">VS</span>
          )}
        </div>

        {/* Team B Section */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0 pt-1.5 sm:pt-0 sm:pl-2">
          <div className="flex flex-col gap-0.5 min-w-0 items-end">
            <PlayerName player={teamBPlayerA} align="right" />
            <PlayerName player={teamBPlayerB} align="right" />
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <PlayerAvatar player={teamBPlayerA} />
            <PlayerAvatar player={teamBPlayerB} />
          </div>
          <TeamLogo team={teamB} />
        </div>

      </div>
    </div>
  );
}

export default NetInputItem;