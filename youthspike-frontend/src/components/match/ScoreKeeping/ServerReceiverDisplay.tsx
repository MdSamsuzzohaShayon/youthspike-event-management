// components/match/ServerReceiverDisplay.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { IReceiverTeam, IServerTeam } from '@/types';
import SRPlayerCard from './SRPlayerCard';

interface ServerReceiverDisplayProps {
  selectedServer: string | null;
  selectedReceiver: string | null;
  serverTeam: IServerTeam | null;
  receiverTeam: IReceiverTeam | null;
  handleAddServer?: (e: React.SyntheticEvent) => void;
  handleAddReceiver?: (e: React.SyntheticEvent) => void;
}

const ServerReceiverDisplay: React.FC<ServerReceiverDisplayProps> = ({ selectedServer, selectedReceiver, serverTeam, receiverTeam, handleAddServer, handleAddReceiver }) => {
  return (
    <div className="display-server-receiver w-full flex justify-center items-center flex-col">
      <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400 mt-6">Selected Server/Receiver</h3>
      <div className="w-full flex justify-center items-center gap-x-2 md:gap-x-6">
        {/* Left Side */}
        <SRPlayerCard player={serverTeam?.servingPartner || null} role="Swing" selected={selectedServer} serverReceiverTeam={serverTeam} dark />

        {/* Middle Side */}
        <div className="w-1/3 flex justify-center items-center">
          <div className="w-full flex flex-col items-center gap-6 p-6">
            <Image alt="Logo" src="/imgs/spikeball-logo.webp" width={40} height={40} className="mb-2" />

            <SRPlayerCard player={serverTeam?.server || null} role="Server" selected={selectedServer} serverReceiverTeam={serverTeam} handlePlayerSelection={handleAddServer ? handleAddServer : () => {}} />

            <div className="flex justify-center items-center py-2">
              <Image alt="Net" src="/imgs/spikeball-net.png" width={80} height={80} />
            </div>

            <SRPlayerCard
              player={receiverTeam?.receiver || null}
              role="Receiver"
              selected={selectedReceiver}
              serverReceiverTeam={receiverTeam}
              handlePlayerSelection={handleAddReceiver ? handleAddReceiver : () => {}}
            />
          </div>
        </div>

        {/* Right Side */}
        <SRPlayerCard player={receiverTeam?.receivingPartner || null} role="Setter" selected={selectedReceiver} serverReceiverTeam={receiverTeam} dark />
      </div>
    </div>
  );
};

export default ServerReceiverDisplay;
