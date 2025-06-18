import TextImg from '@/components/elements/TextImg';
import cld from '@/config/cloudinary.config';
import { IPlayer, IReceiverTeam, IServerTeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react';

interface ISPPlayerCardProps {
  selected: string | null;
  team: IServerTeam | IReceiverTeam | null;
  player: IPlayer | null;
  role: string;
}

// SRPlayerCard = Server Receiver Player Card
const SRPlayerCard: React.FC<ISPPlayerCardProps> = ({ selected, team, player, role }) => {
  return (
    <div>
      {/* Avatar container */}
      <div className="h-24 w-24 bg-white flex items-center justify-center rounded-2xl shadow-lg overflow-hidden border-2 border-yellow-400">
        {selected && team ? (
          player?.profile ? (
            <AdvancedImage cldImg={cld.image(player?.profile)} />
          ) : (
            <TextImg className="w-full h-full rounded-xl" fText={player?.firstName} lText={player?.lastName} />
          )
        ) : (
          <div />
        )}
      </div>

      {/* Name */}
      {selected && team && <h4 className="text-xs font-semibold text-yellow-logo tracking-wide text-center mt-2">{`${player?.firstName} ${player?.lastName}`}</h4>}

      {/* Role */}
      <h3 className="text-center uppercase text-yellow-logo font-bold text-sm leading-tight tracking-wider whitespace-pre-line">{role.split(' ').join('\n')}</h3>
    </div>
  );
};

export default SRPlayerCard;
