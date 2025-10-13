import TextImg from "@/components/elements/TextImg";
import {
  EServerReceiverAction,
  INetRelatives,
  IPlayer,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import { CldImage } from "next-cloudinary";
import React, { useMemo } from "react";

interface ICurrentActionProps {
  srOnNet: IServerReceiverOnNetMixed | null;
  serverReceiverPlays: IServerReceiverSinglePlay[];
  playerMap: Map<string, IPlayer>;
  net: INetRelatives;
  teamA: ITeam | null;
  teamB: ITeam | null;
}

/**
 * ✅ Utility helper to find team by player ID
 */
const findTeamByPlayer = (
  net: INetRelatives,
  playerId: string,
  teamA: ITeam | null,
  teamB: ITeam | null
): ITeam | null => {
  const isTeamA =
    net.teamAPlayerA === playerId || net.teamAPlayerB === playerId;
  const isTeamB =
    net.teamBPlayerA === playerId || net.teamBPlayerB === playerId;
  return isTeamA ? teamA : isTeamB ? teamB : null;
};

const CurrentAction: React.FC<ICurrentActionProps> = ({
  srOnNet,
  serverReceiverPlays,
  playerMap,
  teamA,
  teamB,
  net,
}) => {
  if (!srOnNet || !serverReceiverPlays.length) return null;

  /**
   * ✅ Sort once (not mutating original array)
   */
  const sortedPlays = useMemo(
    () => [...serverReceiverPlays].sort((a, b) => a.play - b.play),
    [serverReceiverPlays]
  );

  const lastPlay = sortedPlays.at(-1);
  if (!lastPlay) return null;

  /**
   * ✅ Compute info using a concise switch-case
   * Avoid repeated string conversions and conditions
   */
  const info = useMemo(() => {
    const serverId = String(lastPlay.server);
    const receiverId = String(lastPlay.receiver);
    let actionText: string | null = null;
    let team: ITeam | null = null;
    let player: IPlayer | null = null;

    const servingTeam = findTeamByPlayer(net, serverId, teamA, teamB);
    const receivingTeam = findTeamByPlayer(net, receiverId, teamA, teamB);

    switch (lastPlay.action) {
      case EServerReceiverAction.SERVER_ACE_NO_TOUCH:
        actionText = "ACE!";
        team = servingTeam;
        player = playerMap.get(serverId) || null;
        break;

      case EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH:
        actionText = "SET ERROR";
        team = receivingTeam;
        break;

      case EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR:
        actionText = "SPIKE ERROR";
        team = receivingTeam;
        player = playerMap.get(receiverId) || null;
        break;

      case EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION:
        actionText = "RALLY POINT";
        team = servingTeam;
        player = playerMap.get(serverId) || null;
        break;

      case EServerReceiverAction.SERVER_DO_NOT_KNOW:
        actionText = "POINT";
        team = servingTeam;
        break;

      case EServerReceiverAction.RECEIVER_SERVICE_FAULT:
        actionText = "DOUBLE FAULT!";
        team = servingTeam;
        player = playerMap.get(serverId) || null;
        break;

      case EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY:
        actionText = "SPIKER PUT AWAY (side out)";
        team = receivingTeam;
        player = playerMap.get(receiverId) || null;
        break;

      case EServerReceiverAction.RECEIVER_RALLEY_CONVERSION:
        actionText = "RALLY POINT";
        team = receivingTeam;
        break;

      case EServerReceiverAction.RECEIVER_DO_NOT_KNOW:
        actionText = "POINT";
        team = servingTeam;
        break;

      default:
        break;
    }

    return { actionText, player, team };
  }, [lastPlay, net, playerMap, teamA, teamB]);

  /**
   * ✅ Simple rendering section
   */
  return (
    <div className="w-full flex flex-col items-center space-y-1">
      {info.actionText && (
        <h4
          className="text-xs md:text-sm font-bold text-center bg-yellow-300 text-black rounded px-2 py-0.5
          animate-pulse shadow-[0_0_10px_rgba(253,224,71,0.9)] drop-shadow-[0_0_6px_rgba(253,224,71,0.8)]"
        >
          {info.actionText}
        </h4>
      )}

      <div className="w-18 h-18 flex justify-between items-center gap-x-1">
        {info.player && (
          info.player.profile ? (
            <CldImage
              src={info.player.profile}
              alt={info.player.firstName}
              height={100}
              width={100}
              className="w-3/6"
            />
          ) : (
            <TextImg className="w-3/6" fullText={info.player.firstName} />
          )
        )}

        {info.team && (
          info.team.logo ? (
            <CldImage
              src={info.team.logo}
              alt={info.team.name}
              height={100}
              width={100}
              className="w-3/6"
            />
          ) : (
            <TextImg className="w-3/6" fullText={info.team.name} />
          )
        )}
      </div>

      {info.player && (
        <h4 className="player-name uppercase text-center">
          {info.player.firstName} {info.player.lastName}
        </h4>
      )}
    </div>
  );
};

export default CurrentAction;
