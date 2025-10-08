/* eslint-disable react/require-default-props */
import React from 'react';
import Link from 'next/link';
import { ITeam, ITeamScore } from '@/types';
import TextImg from '../elements/TextImg';
import { CldImage } from 'next-cloudinary';

interface ITeamRowProps {
  team: ITeam;
  index: number;
  teamScores?: ITeamScore | null;
  selectedGroup?: string | null;
}

function TeamRow({ team, teamScores, index, selectedGroup }: ITeamRowProps) {
  // Handle case where teamScores might be undefined or null
  const hasScores = teamScores && typeof teamScores === 'object';
  
  return (
    <tr
      key={team._id}
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
    >
      <td className="py-3 px-2 flex justify-start items-center md:text-start gap-x-2 text-center">
        <span>{index + 1}</span>
        <Link href={`/teams/${team._id}`} className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-2">
          <span>
            {team?.logo ? (
              <CldImage alt={team.name} width="200" height="200" className="w-14 h-14 object-center object-cover" src={team.logo} crop="fit" />
            ) : (
              <TextImg fullText={team?.name} className="w-14 h-14 object-fit object-cover" />
            )}
          </span>
          {team.name}
        </Link>
      </td>
      {selectedGroup && (
        <td className="py-3 px-2">
          {hasScores ? `${teamScores.groupWins}-${teamScores.groupLoses}` : '0-0'}
        </td>
      )}
      <td className="py-3 px-2">
        {hasScores ? `${teamScores.overallWins}-${teamScores.overallLoses}` : '0-0'}
      </td>
      <td className="py-3 px-2">
        {hasScores ? teamScores.matchAvgDiff.toFixed(2) : '0.00'}
      </td>
      <td className="py-3 px-2">
        {hasScores ? teamScores.gameAvgDiff.toFixed(2) : '0.00'}
      </td>
    </tr>
  );
}

export default TeamRow;