/* eslint-disable react/require-default-props */
import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { IBadge, ITeam, ITeamScore } from '@/types';
import TextImg from '../elements/TextImg';
import { CldImage } from 'next-cloudinary';
import { MATCH_WIN_POINTS } from '@/utils/constant';
import LogoBadge from '../badge/LogoWithBadge';
import LogoWithBadge from '../badge/LogoWithBadge';

interface ITeamRowProps {
  team: ITeam;
  index: number;
  teamScores?: ITeamScore | null;
  selectedGroup?: string | null;
  badge?: IBadge | null;
}

function TeamRow({ team, teamScores, index, badge, selectedGroup }: ITeamRowProps) {
  // Handle case where teamScores might be undefined or null
  const hasScores = teamScores && typeof teamScores === 'object';

  const teamPoints = useMemo(
    () => {
      if (!teamScores) return 0;
      // totalMatches: number, wins: number, loss: number
      const totalMatches = selectedGroup ? teamScores.groupMatches : teamScores.totalMatches;
      const wins = selectedGroup ? teamScores.groupWins : teamScores.overallWins;
      const loss = selectedGroup ? teamScores.groupLoses : teamScores.overallLoses;

      const draws = Math.max(0, totalMatches - wins - loss);

      const points = wins * MATCH_WIN_POINTS + draws;

      return points;
    },
    [selectedGroup, teamScores]
  );

  if (badge) {
    console.log('Badge:', badge);
    console.log('Badge icon:', badge?.icon);
  }
  return (
    <tr
      key={team._id}
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
    >
      <td className="py-3 px-2 flex justify-start items-center md:text-start gap-x-2 text-center">
        <span>{index + 1}</span>
          <LogoBadge
            logo={team.logo}
            teamName={team.name}
            badge={badge}
            size="w-14 h-14"
            badgeSize="w-6 h-6"
          />
        <Link href={`/teams/${team._id}/roster`} className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-2">


          <span
            className="
          font-medium
          text-white
          transition-colors
          group-hover:text-yellow-300
        "
          >
            {team.name}
          </span>
        </Link>
      </td>
      <td className="py-3 px-2">
        {hasScores ? `${teamScores.totalMatches}` : '0'}
      </td>
      <td className="py-3 px-2">
        {hasScores ? `${teamPoints}` : '0'}
      </td>

      {/* Overall record  */}
      <td className="py-3 px-2">
        {hasScores ? `${teamScores.overallWins}-${teamScores.totalMatches - (teamScores.overallWins + teamScores.overallLoses)}-${teamScores.overallLoses}` : '0-0'}
      </td>

      {/* Group record  */}
      {selectedGroup && (
        <td className="py-3 px-2">
          {hasScores ? `${teamScores.groupWins}-${teamScores.totalMatches - (teamScores.groupWins + teamScores.groupLoses)}-${teamScores.groupLoses}` : '0-0'}
        </td>
      )}

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