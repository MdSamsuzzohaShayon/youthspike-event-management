import TextImg from '@/components/elements/TextImg';
import cld from '@/config/cloudinary.config';
import { useAppSelector } from '@/redux/hooks';
import { IPlayer, IReceiverTeam, IServerTeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import React, { useMemo } from 'react';

interface ISPPlayerCardProps {
  selected: string | null;
  serverReceiverTeam: IServerTeam | IReceiverTeam | null;
  player: IPlayer | null;
  role: string;
  dark?: boolean;
  handlePlayerSelection?: (e: React.SyntheticEvent) => void;
}

// SRPlayerCard = Server Receiver Player Card
const SRPlayerCard: React.FC<ISPPlayerCardProps> = ({ selected, serverReceiverTeam, player, role, dark, handlePlayerSelection }) => {
  const { teamA, teamB } = useAppSelector((state) => state.teams);

  const teamOfPlayer = useMemo(() => {
    let team = null;
    if (teamA?._id && player?.teams?.some((team) => team === teamA._id)) {
      team = teamA;
    }
    if (teamB?._id && player?.teams?.some((team) => team === teamB._id)) {
      team = teamB;
    }
    return team;
  }, [player, teamA, teamB]);

  return (
    <div
      className={`relative flex flex-col items-center w-28 lg:w-36 p-4 rounded-3xl shadow-lg transition-shadow
                  ${dark ? 'bg-gray-900/80 border border-gray-700' : 'bg-white/60 border border-gray-200'}
                  hover:shadow-2xl backdrop-blur`}
    >
      {/* role badge */}
      <span
        className={`absolute -top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase
                    ${dark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-600'}`}
      >
        {role}
      </span>

      {/* avatar */}
      <button
        type="button"
        onClick={handlePlayerSelection}
        aria-label="Select player"
        className="group h-24 w-24 rounded-2xl border-4 border-yellow-400 overflow-hidden
                   flex items-center justify-center bg-gray-800 shadow-inner
                   transition-transform hover:scale-105"
      >
        {selected && serverReceiverTeam ? (
          player?.profile ? (
            <AdvancedImage cldImg={cld.image(player.profile)} className="object-cover w-full h-full" />
          ) : (
            <TextImg className="w-full h-full" fText={player?.firstName} lText={player?.lastName} />
          )
        ) : dark ? (
          <div />
        ) : (
          <Image alt="Add player" src="/icons/plus.svg" width={32} height={32} className='svg-white' />
        )}
      </button>

      {/* name + team */}
      {selected && serverReceiverTeam && (
        <>
          <h4 className="mt-3 text-sm font-semibold text-yellow-logo text-center truncate max-w-full">{`${player?.firstName} ${player?.lastName}`}</h4>
          <span className="text-xs font-medium text-gray-400 text-center">{teamOfPlayer?.name}</span>
        </>
      )}
    </div>
  );
};

export default SRPlayerCard;
