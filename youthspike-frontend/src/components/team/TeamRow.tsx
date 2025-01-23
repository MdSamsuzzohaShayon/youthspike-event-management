/* eslint-disable react/require-default-props */
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ITeam, ITeamScore } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import { rowVariant } from '@/utils/animation';
import cld from '@/config/cloudinary.config';
import TextImg from '../elements/TextImg';

interface ITeamRowProps {
  team: ITeam;
  index: number;
  teamScores?: ITeamScore;
  selectedGroup?: string | null;
}
function TeamRow({ team, teamScores, index, selectedGroup }: ITeamRowProps) {
  return (
    <motion.tr
      key={team._id}
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
      custom={index} // Pass index for dynamic delay
      variants={rowVariant}
      initial="hidden"
      animate="visible"
    >
      <td className="py-3 px-2 flex justify-start items-center gap-x-2">
        <span>{index + 1}</span>
        <Link href={`/teams/${team._id}`} className="flex justify-start items-center gap-2">
          <span>{team?.logo ? <AdvancedImage cldImg={cld.image(team.logo)} className="h-10 w-10" /> : <TextImg fullText={team?.name} className="h-10 w-10" />}</span>
          {team.name}
        </Link>
      </td>
      {selectedGroup && <td className="py-3 px-2">{teamScores && `${teamScores.groupWins}-${teamScores.groupLoses}`}</td>}
      <td className="py-3 px-2">{teamScores && `${teamScores.overallWins}-${teamScores.overallLoses}`}</td>
      <td className="py-3 px-2">{teamScores && `${teamScores.matchAvgDiff.toFixed(2)}`}</td>
      <td className="py-3 px-2">{teamScores && `${teamScores.gameAvgDiff.toFixed(2)}`}</td>
    </motion.tr>
  );
}

export default TeamRow;
