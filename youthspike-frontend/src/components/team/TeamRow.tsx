/* eslint-disable react/require-default-props */
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ITeam, ITeamScore } from '@/types';
import { rowVariant } from '@/utils/animation';
import TextImg from '../elements/TextImg';
import { CldImage } from 'next-cloudinary';

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
      // custom={index} // Pass index for dynamic delay
      variants={rowVariant}
      initial="hidden"
      animate="visible"
    >
      <td className="py-3 px-2 flex justify-start items-center md:text-start gap-x-2 text-center">
        <span>{index + 1}</span>
        <Link href={`/teams/${team._id}`} className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-2">
          <span>
            {team?.logo ? (
              <CldImage alt={team.name} width="200" height="200" className="w-14 h-14 object-fit object-cover" src={team.logo} />
            ) : (
              <TextImg fullText={team?.name} className="w-14 h-14 object-fit object-cover" />
            )}
          </span>
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
