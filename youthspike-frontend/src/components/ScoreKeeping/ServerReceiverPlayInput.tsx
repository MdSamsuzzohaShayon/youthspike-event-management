import React, { useMemo } from "react";
import {
  ESRRole,
  IServerReceiverSinglePlay,
  IPlayer,
  IServerReceiverOnNetMixed,
  EServerReceiverAction,
  ETeam,
} from "@/types";

interface IServerReceiverPlayInputProps {
  sr: IServerReceiverSinglePlay;
  teamAById: Map<string, IPlayer>;
  teamBById: Map<string, IPlayer>;
  toBeSelectedPlay: number | null;
  setToBeSelectedPlay: React.Dispatch<React.SetStateAction<number | null>>;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
}

const getPlayerName = (
  id: string | null,
  teamAById: Map<string, IPlayer>,
  teamBById: Map<string, IPlayer>
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
  setToBeSelectedPlay,
  teamAPlayers,
  teamBPlayers,
}) => {
  const actionPlay = useMemo(() => {
    //  EServerReceiverAction.SERVER_DO_NOT_KNOW;
    switch (sr.action) {
      case EServerReceiverAction.SERVER_ACE_NO_TOUCH:
        return "Ace no-touch";
      case EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH:
        return "Ace no 3rd touch";
      case EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR:
        return "Receiving hitting error";
      case EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION:
        return "Defensive Conversion";
      case EServerReceiverAction.SERVER_DO_NOT_KNOW:
        return "Server don't know";

      case EServerReceiverAction.RECEIVER_SERVICE_FAULT:
        return "Double Fault";
      case EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY:
        return "1-2-3 Put Away";
      case EServerReceiverAction.RECEIVER_RALLEY_CONVERSION:
        return "Rally Conversion";
      case EServerReceiverAction.RECEIVER_DO_NOT_KNOW:
        return "Receiver don't know";
      default:
        return "Server don't know";
    }
  }, [sr]);

  const serverTeamE: ETeam | null = useMemo(() => {
    if (!sr.serverId) return null;
    const teamAPlayerIds = new Set(teamAPlayers.map((p) => p._id));
    const teamBPlayerIds = new Set(teamBPlayers.map((p) => p._id));
    if (teamAPlayerIds.has(sr.serverId)) {
      return ETeam.teamA;
    } else if (teamBPlayerIds.has(sr.serverId)) {
      return ETeam.teamB;
    }
    return null;
  }, [teamAPlayers, teamBPlayers]);

  const serverTeamScore = useMemo(() => {
    if (serverTeamE === ETeam.teamA) {
      return sr.teamAScore;
    }
    if (serverTeamE === ETeam.teamB) {
      return sr.teamBScore;
    }
    return null;
  }, [sr, serverTeamE]);
  const receiverTeamScore = useMemo(() => {
    if (serverTeamE === ETeam.teamA) {
      return sr.teamBScore;
    }
    if (serverTeamE === ETeam.teamB) {
      return sr.teamAScore;
    }
    return null;
  }, [sr, serverTeamE]);

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
        className={`mt-2 border-t text-xs font-medium tracking-wide flex items-center justify-center gap-4 py-1 ${
          sr.play === toBeSelectedPlay
            ? "border-yellow-300/30 text-yellow-200"
            : "border-yellow-500/10 text-yellow-300"
        }`}
      >
        {/* Serving Team */}
        <span className="text-yellow-300">
          Serving:{" "}
          <span className="text-white font-bold">{serverTeamScore}</span>
        </span>

        {/* Divider */}
        <span className="text-yellow-500">|</span>

        {/* Receiving Team */}
        <span className="text-yellow-300">
          Receiving:{" "}
          <span className="text-white font-bold">{receiverTeamScore}</span>
        </span>

        {/* Small separator dot */}
        <span className="text-yellow-500">•</span>

        {/* Play Number */}
        <span className="text-yellow-300">Play #{sr.play}</span>

        {/* Action Play */}
        <span className="text-yellow-400">({actionPlay})</span>
      </div>
    </li>
  );
};

export default ServerReceiverPlayInput;
