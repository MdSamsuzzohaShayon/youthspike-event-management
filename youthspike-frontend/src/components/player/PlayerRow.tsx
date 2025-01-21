import React from 'react';
import { motion } from 'framer-motion';
import { AdvancedImage } from '@cloudinary/react';
import { rowVariant } from '@/utils/animation';
import Image from 'next/image';
import { IPlayerRecord } from '@/types';
import cld from '@/config/cloudinary.config';
import Link from 'next/link';

interface IPlayerRowProps {
  player: IPlayerRecord;
  index: number;
  // eslint-disable-next-line react/no-unused-prop-types, react/require-default-props
  teamRank?: boolean;
}

function PlayerRow({ player, index, teamRank }: IPlayerRowProps) {
  return (
    <motion.tr
      key={player._id} // Assuming `player.id` exists
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
      custom={index} // Pass index for dynamic delay
      variants={rowVariant}
      initial="hidden"
      animate="visible"
    >
      <td className="py-3 px-4 font-medium">{teamRank ? player.rank : index + 1}</td>
      <td className="py-3 px-4 flex flex-col">
        {player.profile ? (
          <AdvancedImage className="w-12 object-cover" cldImg={cld.image(player.profile)} />
        ) : (
          <Image width={200} height={200} src="/icons/sports-man.svg" alt="Player Avatar" className="svg-white w-12 h-12 object-contain" />
        )}
        <span>{`${player.firstName} ${player.lastName}`}</span>
        {player.teams && player.teams?.length > 0 && (
          <Link href={`/teams/${player.teams[0]._id}`} className="text-yellow-400 uppercase text-sm">
            {player.teams[0].name}
          </Link>
        )}
        {player?.captainofteams?.length > 0 && <p className="text-yellow-400 uppercase text-sm">Captain</p>}
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
    </motion.tr>
  );
}

export default PlayerRow;
