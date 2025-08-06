import React from "react";
import {
  ESRRole,
  IServerReceiverSinglePlay,
  IPlayer,
  IServerReceiverOnNetMixed,
} from "@/types";

interface IServerReceiverPlayInputProps {
  sr: IServerReceiverSinglePlay;
  teamAById: Map<string, IPlayer>;
  teamBById: Map<string, IPlayer>;
  toBeSelectedPlay: number | null;
  setToBeSelectedPlay: React.Dispatch<React.SetStateAction<number | null>>;
}

const getPlayerName = (
  id: string | null,
  teamAById: Map<string, IPlayer>,
  teamBById: Map<string, IPlayer>,

): string => {
  if (!id) return "Unknown";
  const player = teamAById.get(id) || teamBById.get(id) || null;
  return player ? `${player.firstName} ${player.lastName}` : "Unknown";
};

const RoleBlock = ({ role, name }: { role: string; name: string }) => (
  <div className="flex">
    <span className="w-24 font-semibold text-gray-300">{role}</span>
    <span className="text-white flex-1 break-words">{name}</span>
  </div>
);

const ServerReceiverPlayInput: React.FC<IServerReceiverPlayInputProps> = ({
  sr,
  teamAById,
  teamBById,
  toBeSelectedPlay, 
  setToBeSelectedPlay
}) => {
  return (
<li
  role="presentation"
  onClick={() => setToBeSelectedPlay(sr.play)}
  className={`p-4 rounded-xl transition-all space-y-4 cursor-pointer shadow-md ${
    sr.play === toBeSelectedPlay
      ? "bg-black border-2 border-yellow-400 text-white"
      : "bg-gray-900 border border-yellow-500/20 hover:border-yellow-500 text-white"
  }`}
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
    {/* Serving Team */}
    <div className="space-y-2">
      <h4
        className={`uppercase text-xs font-bold tracking-widest pb-1 border-b ${
          sr.play === toBeSelectedPlay
            ? "text-yellow-300 border-yellow-300/40"
            : "text-yellow-400 border-yellow-400/30"
        }`}
      >
        Serving Team
      </h4>
      <div className="space-y-1">
        <RoleBlock
          role={ESRRole.SERVER}
          name={getPlayerName(sr.serverId || null, teamAById, teamBById)}
        />
        <RoleBlock
          role={ESRRole.SWING}
          name={getPlayerName(
            sr.servingPartnerId || null,
            teamAById,
            teamBById
          )}
        />
      </div>
    </div>

    {/* Receiving Team */}
    <div className="space-y-2">
      <h4
        className={`uppercase text-xs font-bold tracking-widest pb-1 border-b ${
          sr.play === toBeSelectedPlay
            ? "text-yellow-300 border-yellow-300/40"
            : "text-yellow-400 border-yellow-400/30"
        }`}
      >
        Receiving Team
      </h4>
      <div className="space-y-1">
        <RoleBlock
          role={ESRRole.RECEIVER}
          name={getPlayerName(sr.receiverId || null, teamAById, teamBById)}
        />
        <RoleBlock
          role={ESRRole.SETTER}
          name={getPlayerName(
            sr.receivingPartnerId || null,
            teamAById,
            teamBById
          )}
        />
      </div>
    </div>
  </div>

  {/* Score and Play */}
  <div
    className={`pt-3 mt-2 border-t text-center text-xs font-medium tracking-wide ${
      sr.play === toBeSelectedPlay
        ? "border-yellow-300/30 text-yellow-200"
        : "border-yellow-500/10 text-yellow-300"
    }`}
  >
    Score: <span className="text-white">21</span> -{" "}
    <span className="text-white">19</span> &nbsp; • &nbsp; Play #{sr.play}
  </div>
</li>


  );
};

export default ServerReceiverPlayInput;
