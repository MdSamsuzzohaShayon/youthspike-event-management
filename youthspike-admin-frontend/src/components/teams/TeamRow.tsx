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
  eventId: string;
  team: ITeam;
  index: number;
  teamScores?: ITeamScore;
  selectedGroup?: string | null;
}
function TeamRow({ eventId, team, teamScores, index, selectedGroup }: ITeamRowProps) {
  return (
    <motion.tr
      key={team._id}
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
      custom={index} // Pass index for dynamic delay
      variants={rowVariant}
      initial="hidden"
      animate="visible"
    >
      <td className="py-3 px-4 font-medium">{index + 1}</td>
      <td className="py-3 px-4 ">
        <Link href={`/${eventId}/teams/${team._id}`} className="flex justify-start items-center gap-2">
          <span>{team?.logo ? <AdvancedImage cldImg={cld.image(team.logo)} className="h-10 w-10" /> : <TextImg fullText={team?.name} className="h-10 w-10" />}</span>
          {team.name}
        </Link>
      </td>
      {selectedGroup && <td className="py-3 px-4">{teamScores && `${teamScores.groupWins}-${teamScores.groupLoses}`}</td>}
      <td className="py-3 px-4">{teamScores && `${teamScores.matchAvgDiff.toFixed(2)}`}</td>
      <td className="py-3 px-4">{teamScores && `${teamScores.gameAvgDiff.toFixed(2)}`}</td>
      <td className="py-3 px-4">{teamScores && `${teamScores.overallWins}-${teamScores.overallLoses}`}</td>
    </motion.tr>
  );
}

export default TeamRow;
