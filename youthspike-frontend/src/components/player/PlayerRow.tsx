import React from 'react';
import { rowVariant } from '@/utils/animation';
import Image from 'next/image';
import { IPlayerRecord, ITeam } from '@/types';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';

interface IPlayerRowProps {
  player: IPlayerRecord;
  index: number;
  // eslint-disable-next-line react/no-unused-prop-types, react/require-default-props
  teamRank?: boolean;
}

function PlayerRow({ player, index, teamRank }: IPlayerRowProps) {
  return (
    <tr
      key={player._id} // Assuming `player.id` exists
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
    >
      <td className="py-3 flex justify-start items-center">
        <span className="ml-2">{teamRank ? player.rank : index + 1}</span>
        <div className="player-img px-4 flex flex-col">
          <Link href={`/players/${player._id}`}>
            {player.profile ? (
              <CldImage alt={player.firstName} width="200" height="200" className="w-12 object-cover" src={player.profile} />
            ) : (
              <Image width={200} height={200} src="/icons/sports-man.svg" alt="Player Avatar" className="svg-white w-12 h-12 object-contain" />
            )}
            <span className="cursor-pointer">{`${player.firstName} ${player.lastName}`}</span>
          </Link>
          {player.teams && player.teams.length > 0 && typeof player.teams[0] === 'object' && (
            <Link href={`/teams/${(player.teams[0] as ITeam)._id}`} className="text-yellow-400 uppercase text-sm">
              {(player.teams[0] as ITeam).name}
            </Link>
          )}
          {player?.captainofteams?.length > 0 && <p className="text-yellow-400 uppercase text-sm">Captain</p>}
        </div>
      </td>
      <td className="py-3 px-4">
        {Number.isNaN((player.wins * 100) / (player.numOfGame - player.running))
          ? '0'
          : (player.numOfGame - player.running === 0 ? 0 : (player.wins * 100) / (player.numOfGame - player.running)).toFixed(2)}
        %
      </td>
      {/* <td className="py-3 px-4">{player.numOfGame - player.running}</td>
      <td className="py-3 px-4">{player.running}</td> */}
      <td className="py-3 px-4">{player.averagePointsDiff.toFixed(2)}</td>
      <td className="py-3 px-4">{`${player.wins}-${player.losses}`}</td>
    </tr>
  );
}

export default PlayerRow;
