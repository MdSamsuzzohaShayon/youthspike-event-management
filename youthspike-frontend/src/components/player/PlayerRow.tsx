import React from 'react';
import { motion } from 'framer-motion';
import { AdvancedImage } from '@cloudinary/react';
import { rowVariant } from '@/utils/animation';
import Image from 'next/image';
import { IPlayerRecord } from '@/types';
import cld from '@/config/cloudinary.config';

interface IPlayerRowProps {
  player: IPlayerRecord;
  index: number;
  selectedGroup: string | null;
}

function PlayerRow({ player, index, selectedGroup }: IPlayerRowProps) {
  return (
    <motion.tr
      key={player._id} // Assuming `player.id` exists
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
      custom={index} // Pass index for dynamic delay
      variants={rowVariant}
      initial="hidden"
      animate="visible"
    >
      <td className="py-3 px-4 font-medium">{index + 1}</td>
      <td className="py-3 px-4">
        {player.profile ? (
          <AdvancedImage className="w-12 object-cover" cldImg={cld.image(player.profile)} />
        ) : (
          <Image width={200} height={200} src="/icons/sports-man.svg" alt="Player Avatar" className="svg-white w-12 h-12 object-contain" />
        )}
        <span>{`${player.firstName} ${player.lastName}`}</span>
      </td>
      {selectedGroup && <td className="py-3 px-4">5</td>}
      <td className="py-3 px-4">{player.running}</td>
      <td className="py-3 px-4">{player.averagePointsDiff.toFixed(2)}</td>
      <td className="py-3 px-4">{`${player.wins}-${player.losses}`}</td>
    </motion.tr>
  );
}

export default PlayerRow;
