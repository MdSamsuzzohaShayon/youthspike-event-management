
import React, { useMemo } from "react";
import Image from "next/image";
import {
  ESRRole,
  ETeam,
  INetRelatives,
  IPlayer,
  IReceiverTeam,
  IServerTeam,
} from "@/types";
import SRPlayerCard from "./SRPlayerCard";

enum EPosition {
  POSITION_A = "POSITION_A",
  POSITION_B = "POSITION_B",
}

interface PlayerPosition {
  team: ETeam;
  position: EPosition;
}

const ServerReceiverDisplay: React.FC<{
  selectedServer: string | null;
  selectedReceiver: string | null;
  serverTeam: IServerTeam | null;
  receiverTeam: IReceiverTeam | null;
  serverTeamE: ETeam | null;
  handleAddReceiver?: (e: React.SyntheticEvent) => void;
  net: INetRelatives | null;
}> = ({
  selectedServer,
  selectedReceiver,
  serverTeamE,
  serverTeam,
  receiverTeam,
  handleAddReceiver,
  net,
}) => {
  // Determine if receiver is Team A
  const isReceiverTeamA = serverTeamE !== ETeam.teamA;

  // Determine server position (which position the server is in)
  const serverPosition = useMemo(() => {
    if (!selectedServer || !serverTeamE || !net || !serverTeam?.server)
      return null;

    const serverId = serverTeam.server._id;

    if (serverTeamE === ETeam.teamA) {
      if (net.teamAPlayerA === serverId)
        return { team: ETeam.teamA, position: EPosition.POSITION_A };
      if (net.teamAPlayerB === serverId)
        return { team: ETeam.teamA, position: EPosition.POSITION_B };
    } else {
      if (net.teamBPlayerA === serverId)
        return { team: ETeam.teamB, position: EPosition.POSITION_A };
      if (net.teamBPlayerB === serverId)
        return { team: ETeam.teamB, position: EPosition.POSITION_B };
    }

    return null;
  }, [selectedServer, serverTeamE, net, serverTeam]);

  // Get all players mapped to their positions
  const positionPlayers = useMemo(() => {
    const players: Record<ETeam, Record<EPosition, IPlayer | null>> = {
      [ETeam.teamA]: {
        [EPosition.POSITION_A]: null,
        [EPosition.POSITION_B]: null,
      },
      [ETeam.teamB]: {
        [EPosition.POSITION_A]: null,
        [EPosition.POSITION_B]: null,
      },
    };

    if (!net || !serverTeam || !receiverTeam || !serverPosition) return players;

    const { team: serverTeamEnum, position: serverPos } = serverPosition;
    const receiverTeamEnum =
      serverTeamEnum === ETeam.teamA ? ETeam.teamB : ETeam.teamA;
    const receiverPos =
      serverPos === EPosition.POSITION_A
        ? EPosition.POSITION_B
        : EPosition.POSITION_A;
    const receiverPartnerPos =
      serverPos === EPosition.POSITION_A
        ? EPosition.POSITION_A
        : EPosition.POSITION_B;

    // Assign server and partner
    players[serverTeamEnum][serverPos] = serverTeam.server;
    players[serverTeamEnum][
      serverPos === EPosition.POSITION_A
        ? EPosition.POSITION_B
        : EPosition.POSITION_A
    ] = serverTeam.servingPartner;

    // Assign receiver and partner
    players[receiverTeamEnum][receiverPos] = receiverTeam.receiver;
    players[receiverTeamEnum][receiverPartnerPos] =
      receiverTeam.receivingPartner;

    return players;
  }, [net, serverTeam, receiverTeam, serverPosition]);

  // Get role for player at position
  const getRoleAtPosition = (
    team: ETeam,
    position: EPosition
  ): ESRRole | null => {
    const player = positionPlayers[team][position];
    if (!player || !serverTeam || !receiverTeam) return null;

    if (team === serverTeamE) {
      return player._id === serverTeam.server?._id
        ? ESRRole.SERVER
        : ESRRole.SWING;
    } else {
      return player._id === receiverTeam.receiver?._id
        ? ESRRole.RECEIVER
        : ESRRole.SETTER;
    }
  };

  // Render position component
  const renderPosition = (team: ETeam, position: EPosition) => {
    const player = positionPlayers[team][position];
    const role = getRoleAtPosition(team, position);
    const isSelected =
      player?._id === selectedReceiver || player?._id === selectedServer;

    return (
      <SRPlayerCard
        key={`${team}-${position}`}
        player={player}
        role={role}
        selected={isSelected ? player?._id || "" : null}
        serverReceiverTeam={isReceiverTeamA ? receiverTeam : serverTeam}
        handlePlayerSelection={handleAddReceiver || (() => {})}
      />
    );
  };

  // Memoize position components
  const positions = useMemo(
    () => ({
      teamAPositionA: renderPosition(ETeam.teamA, EPosition.POSITION_A),
      teamAPositionB: renderPosition(ETeam.teamA, EPosition.POSITION_B),
      teamBPositionA: renderPosition(ETeam.teamB, EPosition.POSITION_A),
      teamBPositionB: renderPosition(ETeam.teamB, EPosition.POSITION_B),
    }),
    [positionPlayers, selectedServer, selectedReceiver]
  );

  return (
    <div className="display-server-receiver w-full flex justify-center items-center flex-col">
      <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400 mt-6">
        Selected Server/Receiver
      </h3>
      <div className="w-full flex justify-center items-center gap-x-2 md:gap-x-6">
        {positions.teamAPositionA}

        <div className="w-1/3 flex justify-center items-center">
          <div className="w-full flex flex-col items-center gap-6 p-6">
            {positions.teamAPositionB}

            <div className="flex justify-center items-center py-2">
              <Image
                alt="Net"
                src="/imgs/spikeball-net.png"
                width={80}
                height={80}
              />
            </div>

            {positions.teamBPositionA}
          </div>
        </div>

        {positions.teamBPositionB}
      </div>
    </div>
  );
};

export default ServerReceiverDisplay;



