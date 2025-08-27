import React from 'react';
import Image from 'next/image';
import { IPlayerRecord, ITeam } from '@/types';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';

interface IPlayerRowProps {
  player: IPlayerRecord;
  index: number;
  teamRank?: boolean;
}

function PlayerRow({ player, index, teamRank }: IPlayerRowProps) {
  return (
    <tr
      key={player._id}
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
    >
      <td className="py-3 px-2 md:px-4 flex items-center min-w-[180px]">
        <span className="w-6 text-center font-medium">
          {teamRank ? player.rank : index + 1}
        </span>
        <div className="ml-2 md:ml-4 flex items-center">
          <Link href={`/players/${player._id}`} className="flex items-center">
            <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
              {player.profile ? (
                <CldImage 
                  alt={player.firstName} 
                  width="40" 
                  height="40" 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover" 
                  src={player.profile} 
                />
              ) : (
                <Image 
                  width={40} 
                  height={40} 
                  src="/icons/sports-man.svg" 
                  alt="Player Avatar" 
                  className="svg-white w-8 h-8 md:w-10 md:h-10 rounded-full object-contain bg-gray-600 p-1" 
                />
              )}
            </div>
            <div className="ml-2 md:ml-3">
              <div className="text-sm md:text-base font-medium hover:text-yellow-400 transition-colors">
                {`${player.firstName} ${player.lastName}`}
              </div>
              {player.teams && player.teams.length > 0 && typeof player.teams[0] === 'object' && (
                <Link 
                  href={`/teams/${(player.teams[0] as ITeam)._id}`} 
                  className="text-yellow-400 text-xs uppercase hover:underline"
                >
                  {(player.teams[0] as ITeam).name}
                </Link>
              )}
              {player?.captainofteams?.length > 0 && (
                <div className="text-yellow-400 text-xs uppercase">Captain</div>
              )}
            </div>
          </Link>
        </div>
      </td>
      <td className="py-3 px-2 md:px-4 text-center hidden md:table-cell">
        {Number.isNaN((player.wins * 100) / (player.numOfGame - player.running))
          ? '0'
          : (player.numOfGame - player.running === 0 ? 0 : (player.wins * 100) / (player.numOfGame - player.running)).toFixed(1)}
        %
      </td>
      <td className="py-3 px-2 md:px-4 text-center">
        {player.averagePointsDiff.toFixed(1)}
      </td>
      <td className="py-3 px-2 md:px-4 text-center">
        {`${player.wins}-${player.losses}`}
      </td>
      <td className="py-3 px-2 md:px-4 text-center hidden lg:table-cell">0</td>
      <td className="py-3 px-2 md:px-4 text-center hidden lg:table-cell">0</td>
      <td className="py-3 px-2 md:px-4 text-center hidden lg:table-cell">0</td>
      <td className="py-3 px-2 md:px-4 text-center hidden xl:table-cell">0</td>
      <td className="py-3 px-2 md:px-4 text-center hidden xl:table-cell">0</td>
      <td className="py-3 px-2 md:px-4 text-center font-medium">
        {Number.isNaN((player.wins * 100) / (player.numOfGame - player.running))
          ? '0'
          : (player.numOfGame - player.running === 0 ? 0 : (player.wins * 100) / (player.numOfGame - player.running)).toFixed(1)}
        %
      </td>
    </tr>
  );
}

export default PlayerRow;