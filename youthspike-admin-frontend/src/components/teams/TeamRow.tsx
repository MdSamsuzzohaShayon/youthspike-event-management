/* eslint-disable react/require-default-props */
import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ITeam, ITeamScore } from '@/types';
import { CldImage } from 'next-cloudinary';
import { rowVariant } from '@/utils/animation';
import TextImg from '../elements/TextImg';
import { useLdoId } from '@/lib/LdoProvider';

interface ITeamRowProps {
  eventId: string;
  team: ITeam;
  index: number;
  teamScores?: ITeamScore;
  selectedGroup?: string | null;
}
function TeamRow({ eventId, team, teamScores, index, selectedGroup }: ITeamRowProps) {
  const {ldoIdUrl} = useLdoId();

  return (
    <motion.tr
      key={team._id}
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
      variants={rowVariant}
      initial="hidden"
      animate="visible"
    >
      <td className="py-3 px-2 flex items-center gap-x-2">
        {/* <span>{index + 1}</span> */}
        <Link href={`/${eventId}/teams/${team._id}/${ldoIdUrl}`} className="flex justify-center items-center gap-2">
          <span>
            {team?.logo ? (
              <CldImage crop="fit" width={100} height={100}  alt="Team logo" src={team.logo} className="w-14 h-14 object-fit object-cover" />
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
