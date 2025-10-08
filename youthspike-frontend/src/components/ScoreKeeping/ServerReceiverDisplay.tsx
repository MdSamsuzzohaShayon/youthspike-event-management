import React, { useCallback, useMemo } from "react";
import Image from "next/image";
import {
  EServerPositionPair,
  ESRRole,
  IPlayer,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import SRPlayerCard from "./SRPlayerCard";

interface IPlayerRole {
  player: IPlayer | null;
  role: ESRRole;
}

const ServerReceiverDisplay: React.FC<{
  currServerReceiver: IServerReceiverOnNetMixed | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  playerMap: Map<string, IPlayer>;
  handleAddReceiver?: (e: React.SyntheticEvent) => void;
  handleAddServer?: (e: React.SyntheticEvent) => void;
}> = ({
  currServerReceiver,
  teamA,
  teamB,
  playerMap,
  handleAddReceiver,
  handleAddServer,
}) => {

  
  const positions = useMemo(() => {
    const posMap = new Map<EServerPositionPair, IPlayerRole>();
    // Initially set server to pair A top
    if (!currServerReceiver) return posMap;

    if (
      currServerReceiver?.serverPositionPair === EServerPositionPair.PAIR_A_TOP
    ) {
      // SWING will be PAIR A, LEFT
      // receiver will be in pair B bottom,
      // receiving partner will be in pair B right
      if (currServerReceiver?.server) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: playerMap.get(String(currServerReceiver.server)) || null,
          role: ESRRole.SERVER,
        });
      }
      if (currServerReceiver?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: playerMap.get(String(currServerReceiver.servingPartner)) || null,
          role: ESRRole.SWING,
        });
      }
      if (currServerReceiver?.receiver) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: playerMap.get(String(currServerReceiver.receiver)) || null,
          role: ESRRole.RECEIVER,
        });
      }
      if (currServerReceiver?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: playerMap.get(String(currServerReceiver.receivingPartner)) || null,
          role: ESRRole.SETTER,
        });
      }
    } else if (
      currServerReceiver?.serverPositionPair === EServerPositionPair.PAIR_A_LEFT
    ) {
      if (currServerReceiver?.server) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: playerMap.get(String(currServerReceiver.server)) || null,
          role: ESRRole.SERVER,
        });
      }
      if (currServerReceiver?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: playerMap.get(String(currServerReceiver.servingPartner)) || null,
          role: ESRRole.SWING,
        });
      }
      if (currServerReceiver?.receiver) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: playerMap.get(String(currServerReceiver.receiver)) || null,
          role: ESRRole.RECEIVER,
        });
      }
      if (currServerReceiver?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: playerMap.get(String(currServerReceiver.receivingPartner)) || null,
          role: ESRRole.SETTER,
        });
      }
    } else if (
      currServerReceiver?.serverPositionPair ===
      EServerPositionPair.PAIR_B_BOTTOM
    ) {
      if (currServerReceiver?.server) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: playerMap.get(String(currServerReceiver.server)) || null,
          role: ESRRole.SERVER,
        });
      }
      if (currServerReceiver?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: playerMap.get(String(currServerReceiver.servingPartner)) || null,
          role: ESRRole.SWING,
        });
      }
      if (currServerReceiver?.receiver) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: playerMap.get(String(currServerReceiver.receiver)) || null,
          role: ESRRole.RECEIVER,
        });
      }
      if (currServerReceiver?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: playerMap.get(String(currServerReceiver.receivingPartner)) || null,
          role: ESRRole.SETTER,
        });
      }
    } else if (
      currServerReceiver?.serverPositionPair ===
      EServerPositionPair.PAIR_B_RIGHT
    ) {
      if (currServerReceiver?.server) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: playerMap.get(String(currServerReceiver.server)) || null,
          role: ESRRole.SERVER,
        });
      }
      if (currServerReceiver?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: playerMap.get(String(currServerReceiver.servingPartner)) || null,
          role: ESRRole.SWING,
        });
      }
      if (currServerReceiver?.receiver) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: playerMap.get(String(currServerReceiver.receiver)) || null,
          role: ESRRole.RECEIVER,
        });
      }
      if (currServerReceiver?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: playerMap.get(String(currServerReceiver.receivingPartner)) || null,
          role: ESRRole.SETTER,
        });
      }
    }

    return posMap;
  }, [currServerReceiver]);

  // pa-left
  const renderPlayerCard = useCallback(
    (positionPairE: EServerPositionPair) => {
      const playerPosition = positions.get(positionPairE);
      let role = null;
      if (positionPairE === EServerPositionPair.PAIR_A_LEFT) {
        role = ESRRole.SERVER;
      } else if (positionPairE === EServerPositionPair.PAIR_B_RIGHT) {
        role = ESRRole.RECEIVER;
      }

      const handlePlayerSelection = (e: React.SyntheticEvent) => {
        if (role === ESRRole.SERVER) {
          if (handleAddServer) handleAddServer(e);
        } else if (role === ESRRole.RECEIVER) {
          if (handleAddReceiver) handleAddReceiver(e);
        }
      };
      if (!playerPosition) {
        return (
          <SRPlayerCard
            key={positionPairE}
            player={null}
            role={role}
            selected={null}
            teamA={teamA}
            teamB={teamB}
            handlePlayerSelection={handlePlayerSelection}
            positionPairE={positionPairE}
          />
        );
      }
      return (
        <SRPlayerCard
          key={positionPairE}
          player={playerPosition.player}
          role={playerPosition.role}
          teamA={teamA}
          teamB={teamB}
          selected={playerPosition.player?._id || null}
          handlePlayerSelection={handlePlayerSelection}
          positionPairE={positionPairE}
        />
      );
    },
    [positions, currServerReceiver, handleAddServer, handleAddReceiver]
  );

  return (
    <div className="display-server-receiver w-full flex justify-center items-center flex-col">
      <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400 mt-6">
        Selected Server/Receiver
      </h3>
      <div className="w-full flex justify-center items-center gap-x-2 md:gap-x-6">
        {renderPlayerCard(EServerPositionPair.PAIR_A_LEFT)}

        <div className="w-1/3 flex justify-center items-center">
          <div className="w-full flex flex-col items-center gap-6 p-6">
            {renderPlayerCard(EServerPositionPair.PAIR_A_TOP)}

            <div className="flex justify-center items-center py-2">
              <Image
                alt="Net"
                src="/imgs/spikeball-net.png"
                width={80}
                height={80}
              />
            </div>

            {renderPlayerCard(EServerPositionPair.PAIR_B_BOTTOM)}
          </div>
        </div>
        {renderPlayerCard(EServerPositionPair.PAIR_B_RIGHT)}
      </div>
    </div>
  );
};

export default ServerReceiverDisplay;
