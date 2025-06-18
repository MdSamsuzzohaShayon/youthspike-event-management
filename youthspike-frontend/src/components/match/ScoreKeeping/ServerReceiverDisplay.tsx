// components/match/ServerReceiverDisplay.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import TextImg from '@/components/elements/TextImg';
import { IReceiverTeam, IServerTeam } from '@/types';
import SRPlayerCard from './SRPlayerCard';

interface ServerReceiverDisplayProps {
  selectedServer: string | null;
  selectedReceiver: string | null;
  serverTeam: IServerTeam | null;
  receiverTeam: IReceiverTeam | null;
  handleAddServer: (e: React.SyntheticEvent) => void;
  handleAddReceiver: (e: React.SyntheticEvent) => void;
}

const ServerReceiverDisplay: React.FC<ServerReceiverDisplayProps> = ({ selectedServer, selectedReceiver, serverTeam, receiverTeam, handleAddServer, handleAddReceiver }) => {
  return (
    <div className="display-server-receiver w-full flex justify-center items-center flex-col">
      <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400 mt-6">Selected Server/Receiver</h3>
      <div className="w-full flex justify-center items-center gap-x-2 md:gap-x-6">
        {/* Left Side */}
        <SRPlayerCard player={serverTeam?.servingPartner || null} role="Serving Partner" selected={selectedServer} team={serverTeam} />

        {/* Middle Side */}
        <div className="w-1/3 flex justify-center items-center">
          <div className="w-full flex flex-col items-center gap-6 bg-white text-black rounded-xl p-6 shadow-lg">
            <Image alt="Logo" src="/imgs/spikeball-logo.webp" width={40} height={40} className="mb-2" />

            <div className="bg-black h-24 w-24 flex items-center justify-center rounded-xl border-4 border-yellow-400 overflow-hidden" role="presentation" onClick={handleAddServer}>
              {selectedServer && serverTeam ? (
                serverTeam?.server?.profile ? (
                  <AdvancedImage cldImg={cld.image(serverTeam?.server?.profile)} />
                ) : (
                  <TextImg className="w-full h-full rounded-0" fText={serverTeam?.server?.firstName} lText={serverTeam?.server?.lastName} />
                )
              ) : (
                <Image alt="Add Server" src="/icons/plus.svg" width={50} height={50} className="invert" />
              )}
            </div>
            <h3 className="text-center uppercase text-yellow-400 font-bold text-sm leading-tight tracking-wider whitespace-pre-line">Server</h3>

            <div className="flex justify-center items-center py-2">
              <Image alt="Net" src="/imgs/spikeball-net.png" width={80} height={80} />
            </div>

            <div className="bg-black h-24 w-24 flex items-center justify-center rounded-xl border-4 border-yellow-400 overflow-hidden" role="presentation" onClick={handleAddReceiver}>
              {selectedReceiver && receiverTeam ? (
                receiverTeam?.receiver?.profile ? (
                  <AdvancedImage cldImg={cld.image(receiverTeam?.receiver?.profile)} />
                ) : (
                  <TextImg className="w-full h-full rounded-0" fText={receiverTeam?.receiver?.firstName} lText={receiverTeam?.receiver?.lastName} />
                )
              ) : (
                <Image alt="Add Receiver" src="/icons/plus.svg" width={50} height={50} className="invert" />
              )}
            </div>

            <h3 className="text-center uppercase text-yellow-400 font-bold text-sm leading-tight tracking-wider whitespace-pre-line">Receiver</h3>
          </div>
        </div>

        {/* Right Side */}
        <SRPlayerCard player={receiverTeam?.receivingPartner || null} role="Receiving Partner" selected={selectedReceiver} team={receiverTeam} />
      </div>
    </div>
  );
};

export default ServerReceiverDisplay;
