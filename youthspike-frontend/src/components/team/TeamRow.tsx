/* eslint-disable react/require-default-props */
import React, { useCallback, useMemo } from 'react';
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

  /*
  Points
  3 for a win
  1 For a draw
  0 for loss
  */

  const teamPoints = useMemo(
    () => {
      if(!teamScores) return 0;
      // totalMatches: number, wins: number, loss: number
      const totalMatches = selectedGroup ? teamScores.groupMatches : teamScores.totalMatches;
      const wins = selectedGroup ? teamScores.groupWins : teamScores.overallWins;
      const loss = selectedGroup ? teamScores.groupLoses : teamScores.overallLoses;
      
      const draws = Math.max(0, totalMatches - wins - loss);
  
      const points = wins * 3 + draws;
  
      return points;
    },
    [selectedGroup, teamScores]
  );

  return (
    <tr
      key={team._id}
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
    >
      <td className="py-3 px-2 flex justify-start items-center md:text-start gap-x-2 text-center">
        <span>{index + 1}</span>
        <Link href={`/teams/${team._id}/roster`} className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-2">
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
      <td className="py-3 px-2">
        {hasScores ? `${teamScores.totalMatches}` : '0'}
      </td>
      <td className="py-3 px-2">
        {hasScores ? `${teamPoints}` : '0'}
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