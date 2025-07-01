/* eslint-disable no-restricted-syntax */
/* eslint-disable react/require-default-props */
import { IMatch, IMatchExpRel, IPlayer, ITeam } from '@/types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ETeam, ITeamScore } from '@/types/team';
import { tableVariant } from '@/utils/animation';
import TeamRow from './TeamRow';
import { calcMatchScore } from '@/utils/calcScore';


interface ITeamStandingsProps {
  eventId: string;
  teamList?: ITeam[];
  matchList?: IMatchExpRel[];
  selectedGroup?: string | null;
}
/*
FC Barcelona
8 - 6 (2 matches)

PSG
6 - 8 (2 matches)

*/

function TeamStandings({ eventId, teamList, matchList, selectedGroup }: ITeamStandingsProps) {
  const [teamScores, setTeamScores] = useState<Map<string, ITeamScore>>(new Map());

  /**
   * Memoized Map of Matches by Team ID
   */
  const matchesByTeam = useMemo(() => {
    const map = new Map<string, IMatch[]>();

    if (matchList) {
      for (const match of matchList) {
        if (match.completed) {
          if (match.teamA?._id) {
            if (!map.has(match.teamA._id)) map.set(match.teamA._id, []);
            // @ts-ignore
            map.get(match.teamA._id)?.push(match);
          }
          if (match.teamB?._id) {
            if (!map.has(match.teamB._id)) map.set(match.teamB._id, []);
            // @ts-ignore
            map.get(match.teamB._id)?.push(match);
          }
        }
      }
    }

    return map;
  }, [matchList]);

  /**
   * Calculate Team Scores
   */
  const calculateTeamScore = useCallback(() => {
    if (!teamList || teamList.length === 0) return;

    const newTeamScores = new Map<string, ITeamScore>();

    for (const team of teamList) {
      const teamMatches = matchesByTeam.get(team._id) || [];
      const teamRecord: ITeamScore = {
        rank: 0,
        totalMatches: 0,
        overallWins: 0,
        overallLoses: 0,
        groupWins: 0,
        groupLoses: 0,
        matchAvgDiff: 0,
        gameAvgDiff: 0,
      };

      let totalMatchDiff = 0;
      let totalGameDiff = 0;
      let totalNets = 0;

      for (const match of teamMatches) {
        
        const isTeamA = match.teamA._id === team._id;
        // @ts-ignore
        const { teamScore, oponentScore, teamPlusMinus } = calcMatchScore(match.rounds, match.nets, isTeamA ? ETeam.teamA : ETeam.teamB);
        

        totalMatchDiff += teamScore - oponentScore;
        totalGameDiff += teamPlusMinus;

        if (teamScore > oponentScore) {
          teamRecord.overallWins += 1;
          if (match?.group?._id) teamRecord.groupWins += 1;
        } else if (oponentScore > teamScore) {
          teamRecord.overallLoses += 1;
          if (match?.group?._id) teamRecord.groupLoses += 1;
        }
        totalNets += match.nets.length;
      }

      teamRecord.totalMatches = teamMatches.length;
      teamRecord.matchAvgDiff = teamMatches.length ? totalMatchDiff / teamMatches.length : 0;
      teamRecord.gameAvgDiff = teamMatches.length ? totalGameDiff / totalNets : 0;

      newTeamScores.set(team._id, teamRecord);
    }

    setTeamScores(newTeamScores);
  }, [teamList, matchesByTeam]);

  /**
   * Rank Teams
   */
  const sortedTeams = useMemo(() => {
    if (!teamList || teamScores.size === 0) return [];
  
    return [...teamList].sort((teamA, teamB) => {
      const scoreA = teamScores.get(teamA._id);
      const scoreB = teamScores.get(teamB._id);
  
      if (!scoreA || !scoreB) return 0;
  
      if (selectedGroup) {
        // Sorting by Group Wins first
        // if (scoreA.groupWins !== scoreB.groupWins) {
        //   return scoreB.groupWins - scoreA.groupWins;  // Higher group wins go up
        // }
        // If Group Wins are tied, sort by Group Losses (lower group losses go up)
        if (scoreA.groupLoses !== scoreB.groupLoses) {
          return scoreA.groupLoses - scoreB.groupLoses;  // Lower group losses go up
        }
      } else {
        // Sorting by Overall Wins first
        // if (scoreA.overallWins !== scoreB.overallWins) {
        //   return scoreB.overallWins - scoreA.overallWins;  // Higher overall wins go up
        // }
        // If Overall Wins are tied, sort by Overall Losses (lower overall losses go up)
        if (scoreA.overallLoses !== scoreB.overallLoses) {
          return scoreA.overallLoses - scoreB.overallLoses;  // Lower overall losses go up
        }
      }
  
      // If the above criteria are tied, sort by matchAvgDiff (higher matchAvgDiff goes up)
      if (scoreA.matchAvgDiff !== scoreB.matchAvgDiff) {
        return scoreB.matchAvgDiff - scoreA.matchAvgDiff;
      }
  
      // If the matchAvgDiff is also tied, sort by gameAvgDiff (higher gameAvgDiff goes up)
      if (scoreA.gameAvgDiff !== scoreB.gameAvgDiff) {
        return scoreB.gameAvgDiff - scoreA.gameAvgDiff;
      }
  
      return 0;  // If all criteria are equal, retain the original order
    });
  }, [teamList, teamScores, selectedGroup]);  // Re-run when teamList, teamScores, or selectedGroup change
  

  /**
   * Trigger Calculations on Dependency Changes
   */
  useEffect(() => {
    calculateTeamScore();
  }, [calculateTeamScore]);

  return (
    <div className="teamList w-full flex flex-col rounded-lg shadow-lg">
      <div className="overflow-x-auto">
        <motion.table className="w-full text-left text-sm text-gray-300 bg-gray-900 rounded-lg overflow-hidden" variants={tableVariant} initial="hidden" animate="visible">
          <thead>
            <tr className="bg-yellow-500 text-black font-semibold">
              <th className="py-3 px-2">Team</th>
              {selectedGroup && <th className="py-3 px-2">Group Record</th>}
              <th className="py-3 px-2">Overall</th>
              <th className="py-3 px-2">Match PT DIFF/AVG</th>
              <th className="py-3 px-2">GM PT DIFF/AVG</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <TeamRow eventId={eventId} selectedGroup={selectedGroup} key={team._id} team={team} teamScores={teamScores.get(team._id)} index={index} />
            ))}
          </tbody>
        </motion.table>
      </div>
    </div>
  );
}

export default TeamStandings;
