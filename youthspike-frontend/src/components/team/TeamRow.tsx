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


  return (
    <tr
      key={team._id}
      className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all"
    >
      <td className="py-2 px-3 sticky left-0 bg-inherit min-w-[120px] max-w-[120px] z-10">
        <div className="md:flex md:items-start">
          <span className="w-5 text-center font-medium text-sm shrink-0 mt-1">
            {index + 1}
          </span>

          <div className="md:ml-2 md:flex md:flex-col md:w-full">
            {/* Team info container */}
            <div className="flex flex-col">
              {/* Team link (logo + name) - Stacked vertically on mobile */}
              <Link
                href={`/teams/${team._id}/roster`}
                className="flex flex-col sm:flex-row sm:items-center"
              >
                <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                  <LogoWithBadge
                    logo={team.logo}
                    name={team.name}
                    badge={badge}
                    size="w-12 h-12"
                    badgeSize="w-4 h-4"
                  />
                </div>
                <div className="ml-0 sm:ml-2 min-w-0 text-center sm:text-left mt-1 sm:mt-0">
                  <div className="text-xs font-medium transition-colors break-words capitalize">
                    <span className="block sm:inline">{team.name}</span>
                  </div>
                </div>
              </Link>

              {/* Badge info - Always below */}
              {badge && (
                <div className="mt-1 flex flex-col items-center sm:items-start">
                  <span className="text-yellow-logo text-[6px] uppercase hover:underline truncate max-w-full">
                    {badge.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </td>



      {/* Points */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-bold text-xl">
            {hasScores ? teamPoints : '0'}
          </span>
        </div>
      </td>

      {/* Overall record */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-bold text-xl">
            {hasScores ? `${teamScores.overallWins}-${teamScores.totalMatches - (teamScores.overallWins + teamScores.overallLoses)}-${teamScores.overallLoses}` : '0-0'}
          </span>
        </div>
      </td>

      {/* Group record */}
      {selectedGroup && (
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-bold text-xl">
              {hasScores ? `${teamScores.groupWins}-${teamScores.totalMatches - (teamScores.groupWins + teamScores.groupLoses)}-${teamScores.groupLoses}` : '0-0'}
            </span>
          </div>
        </td>
      )}

      {/* Matches */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-bold text-xl">
            {hasScores ? teamScores.totalMatches : '0'}
          </span>
        </div>
      </td>

      {/* Match PT DIFF/AVG */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-bold text-xl">
            {hasScores ? teamScores.matchAvgDiff.toFixed(2) : '0.00'}
          </span>
        </div>
      </td>

      {/* GM PT DIFF/AVG */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-bold text-xl">
            {hasScores ? teamScores.gameAvgDiff.toFixed(2) : '0.00'}
          </span>
        </div>
      </td>
    </tr>
  );
}

export default TeamRow;