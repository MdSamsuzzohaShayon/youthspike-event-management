import React, { useCallback, useMemo } from "react";
import Image from "next/image";
import {
  EPair,
  EPosition,
  EServerPositionPair,
  ESide,
  ESRRole,
  ETeam,
  INetRelatives,
  IPlayer,
  IReceiverTeam,
  IServerReceiverOnNetMixed,
  IServerTeam,
} from "@/types";
import SRPlayerCard from "./SRPlayerCard";

interface IPlayerRole {
  player: IPlayer | null;
  role: ESRRole;
}

const ServerReceiverDisplay: React.FC<{
  currServerReceiver: IServerReceiverOnNetMixed | null;
  serverTeam: IServerTeam | null;
  receiverTeam: IReceiverTeam | null;
  handleAddReceiver?: (e: React.SyntheticEvent) => void;
  handleAddServer?: (e: React.SyntheticEvent) => void;
}> = ({
  currServerReceiver,
  serverTeam,
  receiverTeam,
  handleAddReceiver,
  handleAddServer,
}) => {
  const positions = useMemo(() => {
    const posMap = new Map<EServerPositionPair, IPlayerRole>();
    // Initially set server to pari A top 
    if(!currServerReceiver){
      if(serverTeam?.server){
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: serverTeam.server,
          role: ESRRole.SERVER,
        });
      }
      if (serverTeam?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: serverTeam?.servingPartner,
          role: ESRRole.SWING,
        });
      }
      if (receiverTeam?.receiver) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: receiverTeam?.receiver,
          role: ESRRole.RECEIVER,
        });
      }
      if (receiverTeam?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: receiverTeam?.receivingPartner,
          role: ESRRole.SETTER,
        });
      }

      // Return the initial position
      return posMap;
    }


    if (
      currServerReceiver?.serverPositionPair === EServerPositionPair.PAIR_A_TOP
    ) {
      // SWING will be PAIR A, LEFT
      // receiver will be in pair B bottom,
      // receiving partner will be in pair B right
      if (serverTeam?.server) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: serverTeam.server,
          role: ESRRole.SERVER,
        });
      }
      if (serverTeam?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: serverTeam?.servingPartner,
          role: ESRRole.SWING,
        });
      }
      if (receiverTeam?.receiver) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: receiverTeam?.receiver,
          role: ESRRole.RECEIVER,
        });
      }
      if (receiverTeam?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: receiverTeam?.receivingPartner,
          role: ESRRole.SETTER,
        });
      }
    } else if (
      currServerReceiver?.serverPositionPair === EServerPositionPair.PAIR_A_LEFT
    ) {
      if (serverTeam?.server) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: serverTeam.server,
          role: ESRRole.SERVER,
        });
      }
      if (serverTeam?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: serverTeam?.servingPartner,
          role: ESRRole.SWING,
        });
      }
      if (receiverTeam?.receiver) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: receiverTeam?.receiver,
          role: ESRRole.RECEIVER,
        });
      }
      if (receiverTeam?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: receiverTeam?.receivingPartner,
          role: ESRRole.SETTER,
        });
      }
    } else if (
      currServerReceiver?.serverPositionPair ===
      EServerPositionPair.PAIR_B_BOTTOM
    ) {
      if (serverTeam?.server) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: serverTeam.server,
          role: ESRRole.SERVER,
        });
      }
      if (serverTeam?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: serverTeam?.servingPartner,
          role: ESRRole.SWING,
        });
      }
      if (receiverTeam?.receiver) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: receiverTeam?.receiver,
          role: ESRRole.RECEIVER,
        });
      }
      if (receiverTeam?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: receiverTeam?.receivingPartner,
          role: ESRRole.SETTER,
        });
      }
    } else if (
      currServerReceiver?.serverPositionPair ===
      EServerPositionPair.PAIR_B_RIGHT
    ) {
      if (serverTeam?.server) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, {
          player: serverTeam.server,
          role: ESRRole.SERVER,
        });
      }
      if (serverTeam?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, {
          player: serverTeam?.servingPartner,
          role: ESRRole.SWING,
        });
      }
      if (receiverTeam?.receiver) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, {
          player: receiverTeam?.receiver,
          role: ESRRole.RECEIVER,
        });
      }
      if (receiverTeam?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, {
          player: receiverTeam?.receivingPartner,
          role: ESRRole.SETTER,
        });
      }
    }

    return posMap;
  }, [currServerReceiver, serverTeam, receiverTeam]);


  
  
  



  // pa-left
  const renderPlayerCard = useCallback((positionPairE: EServerPositionPair) => {
    const playerPosition = positions.get(positionPairE);
    let role = null;
    if(positionPairE === EServerPositionPair.PAIR_A_LEFT ){
      role = ESRRole.SERVER;
    }else if(positionPairE === EServerPositionPair.PAIR_B_RIGHT){
      role = ESRRole.RECEIVER;
    }

    const handlePlayerSelection=(e: React.SyntheticEvent)=>{
      if(role ===  ESRRole.SERVER){
        if(handleAddServer)handleAddServer(e);
      }else if(role ===  ESRRole.RECEIVER){
        if(handleAddReceiver)handleAddReceiver(e);
      }
    }
    if(!playerPosition){

      return (
        <SRPlayerCard
          key={positionPairE}
          player={null}
          role={role}
          selected={null}
          handlePlayerSelection={handlePlayerSelection}
          positionPairE={positionPairE}
        />
      )
    }
    return (
      <SRPlayerCard
        key={positionPairE}
        player={playerPosition.player}
        role={playerPosition.role}
        selected={playerPosition.player?._id || null}
        handlePlayerSelection={handlePlayerSelection}
        positionPairE={positionPairE}
      />
    );
  }, [positions, handleAddServer, handleAddReceiver]);

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
