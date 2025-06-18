import TextImg from '@/components/elements/TextImg';
import cld from '@/config/cloudinary.config';
import { IPlayer, IReceiverTeam, IServerTeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react';
import SRPlayerCard from './SRPlayerCard';

interface ISideCardHolderProps {
  selected: string | null;
  team: IServerTeam | IReceiverTeam | null;
  player: IPlayer | null;
  role: string;
}

// SideCardHolder = Server Receiver Player Card
const SideCardHolder: React.FC<ISideCardHolderProps> = ({ selected, team, player, role }) => {
  return (
    <div className="w-1/3 flex flex-col items-center">
      {/* Spacer */}
      <div className="w-24 h-24" />

      <SRPlayerCard player={player} role={role} selected={selected} team={team} />

      {/* Spacer */}
      <div className="w-24 h-24" />
    </div>
  );
};

export default SideCardHolder;
