/* eslint-disable react/require-default-props */
import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { IBadge, ITeam, ITeamScore } from '@/types';
import { MATCH_WIN_POINTS } from '@/utils/constant';
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
      const totalMatches = teamScores.totalMatches;
      const wins = teamScores.overallWins;
      const loss = teamScores.overallLoses;

      const draws = Math.max(0, totalMatches - wins - loss);

      const points = wins * MATCH_WIN_POINTS + draws;

      return points;
    },
    [teamScores]
  );


  const teamGroupPoints = useMemo(() => {
    if (!teamScores || !selectedGroup) return 0;
  
    const groupDraws = Math.max(
      0,
      teamScores.groupMatches -
        teamScores.groupWins -
        teamScores.groupLoses
    );
  
    const groupPoints =
      teamScores.groupWins * MATCH_WIN_POINTS + groupDraws;
  
    const totalMatches =
      teamScores.groupMatches + teamScores.teammatchabsencescount;
  
    const points = groupPoints / totalMatches;
  
    return Number.isNaN(points) ? 0 : points.toFixed(2);
  }, [selectedGroup, teamScores]);

  const totalGroupPoints = useMemo(() => {
    if (!teamScores || !selectedGroup) return 0;
  
    const groupDraws = Math.max(
      0,
      teamScores.groupMatches -
        teamScores.groupWins -
        teamScores.groupLoses
    );
  
    const groupPoints =
      teamScores.groupWins * MATCH_WIN_POINTS + groupDraws;
  
  
    return groupPoints;
  }, [selectedGroup, teamScores]);




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
                    size="w-16 h-16"
                    badgeSize="w-8 h-8"
                  />
                </div>
                <div className="ml-0 sm:ml-2 min-w-0 text-center sm:text-left mt-1 sm:mt-0">
                  <div className="text-xs font-medium transition-colors break-words capitalize">
                    <span className="block sm:inline">{team.name}</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </td>

      {/* Group Points per match  */}
      {selectedGroup && (
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-bold text-xl">
              {hasScores ? teamGroupPoints : 0}
            </span>
          </div>
        </td>
      )}

      {/* Group record */}
      {selectedGroup && (
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-bold text-xl">
              {hasScores ? `${teamScores.groupWins}-${teamScores.groupMatches - (teamScores.groupWins + teamScores.groupLoses)}-${teamScores.groupLoses}` : '0-0'}
            </span>
          </div>
        </td>
      )}

      {/* Overall record */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-bold text-xl">
            {hasScores ? `${teamScores.overallWins}-${teamScores.totalMatches - (teamScores.overallWins + teamScores.overallLoses)}-${teamScores.overallLoses}` : '0-0'}
          </span>
        </div>
      </td>



      {/* Total Group Points */}
      {selectedGroup && (
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-bold text-xl">
              {hasScores ? totalGroupPoints: '0'}
            </span>
          </div>
        </td>
      )}

      {/* Group Matches */}
      {selectedGroup && (
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-bold text-xl">
              {hasScores ? teamScores.groupMatches + teamScores.teammatchabsencescount : '0'}
            </span>
          </div>
        </td>
      )}

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