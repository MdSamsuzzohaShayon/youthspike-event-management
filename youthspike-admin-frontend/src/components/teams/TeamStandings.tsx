/* eslint-disable no-restricted-syntax */
/* eslint-disable react/require-default-props */
import { IMatch, IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, ITeam } from '@/types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ETeam, ITeamScore } from '@/types/team';
import { tableVariant } from '@/utils/animation';
import TeamRow from './TeamRow';
import { calcMatchScore, calcScore } from '@/utils/calcScore';

interface ITeamStandingsProps {
  nets?: INetRelatives[];
  rounds?: IRoundRelatives[];
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

function TeamStandings({ teamList, matchList, nets, rounds, selectedGroup }: ITeamStandingsProps) {
  const [teamScores, setTeamScores] = useState<Map<string, ITeamScore>>(new Map());

  /**
   * Memoized Map of Matches by Team ID
   */
  const matchesByTeam = useMemo(() => {
    const map = new Map<string, IMatch[]>();

    if (matchList) {
      for (const match of matchList) {
        if (match.completed) {
          if (match.teamA) {
            const teamAId: string = typeof match.teamA === 'object' ? match.teamA._id : String(match.teamA);
            if (!map.has(teamAId)) map.set(teamAId, []);
            map.get(teamAId)?.push(match as IMatch);
          }
          if (match.teamB) {
            const teamBId: string = typeof match.teamB === 'object' ? match.teamB._id : String(match.teamB);
            if (!map.has(teamBId)) map.set(teamBId, []);
            map.get(teamBId)?.push(match as IMatch);
          }
        }
      }
    }

    return map;
  }, [matchList]);

  const netsByMatch = useMemo(() => {
    const map = new Map<string, INetRelatives[]>();
    if (!nets) return map;
    for (const net of nets) {
      if (!map.has(net.match)) map.set(net.match, []);
      map.get(net.match)?.push(net);
    }
    return map;
  }, [nets]);

  const roundsByMatch = useMemo(() => {
    const map = new Map<string, IRoundRelatives[]>();
    if (!rounds) return map;
    for (const round of rounds) {
      if (!map.has(round.match)) map.set(round.match, []);
      map.get(round.match)?.push(round);
    }
    return map;
  }, [rounds]);

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
      let totalGroupMatches = 0;

      for (const match of teamMatches) {
        const teamAId: string = typeof match.teamA === 'object' ? match.teamA._id : String(match.teamA);
        const isTeamA = teamAId === team._id;
        // const { teamScore, oponentScore, teamPlusMinus } = calcMatchScore(match.rounds, match.nets, isTeamA ? ETeam.teamA : ETeam.teamB);
        const nets = netsByMatch?.get(match._id) || [];
        const rounds = roundsByMatch?.get(match._id) || [];

        const { matchScore } = calcScore(nets, rounds);
        const matchGroupId: string | null = match?.group?._id || String(match?.group) || null;

        const teamScore = isTeamA ? matchScore.teamAMScore : matchScore.teamBMScore;
        const oponentScore = isTeamA ? matchScore.teamBMScore : matchScore.teamAMScore;

        if (!selectedGroup || (selectedGroup && selectedGroup === matchGroupId)) {
          totalGroupMatches += 1;
          totalMatchDiff += teamScore - oponentScore;
          totalGameDiff += isTeamA ? matchScore.teamAMPlusMinus : matchScore.teamBMPlusMinus;
          totalNets += match.nets.length;
        }

        if (teamScore > oponentScore) {
          // It will not affect group
          teamRecord.overallWins += 1;
          if (matchGroupId && matchGroupId === selectedGroup) teamRecord.groupWins += 1;
        } else if (oponentScore > teamScore) {
          // It will not affect group
          teamRecord.overallLoses += 1;
          if (matchGroupId && matchGroupId === selectedGroup) teamRecord.groupLoses += 1;
        }
      }

      teamRecord.totalMatches = teamMatches.length;

      // Only for group records
      teamRecord.matchAvgDiff = totalGroupMatches > 0 ? totalMatchDiff / totalGroupMatches : 0;
      teamRecord.gameAvgDiff = totalGroupMatches > 0 ? totalGameDiff / totalNets : 0;

      newTeamScores.set(team._id, teamRecord);
    }

    setTeamScores(newTeamScores);
  }, [teamList, matchesByTeam, netsByMatch, roundsByMatch]);

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
          return scoreA.groupLoses - scoreB.groupLoses; // Lower group losses go up
        }
      } else {
        // Sorting by Overall Wins first
        // if (scoreA.overallWins !== scoreB.overallWins) {
        //   return scoreB.overallWins - scoreA.overallWins;  // Higher overall wins go up
        // }
        // If Overall Wins are tied, sort by Overall Losses (lower overall losses go up)
        if (scoreA.overallLoses !== scoreB.overallLoses) {
          return scoreA.overallLoses - scoreB.overallLoses; // Lower overall losses go up
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

      return 0; // If all criteria are equal, retain the original order
    });
  }, [teamList, teamScores, selectedGroup]); // Re-run when teamList, teamScores, or selectedGroup change

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
            <tr className="bg-yellow-logo text-black font-semibold">
              <th className="py-3 px-2">Team</th>
              {selectedGroup && <th className="py-3 px-2">Group Record</th>}
              <th className="py-3 px-2">Overall</th>
              <th className="py-3 px-2">Match PT DIFF/AVG</th>
              <th className="py-3 px-2">GM PT DIFF/AVG</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <TeamRow selectedGroup={selectedGroup} key={team._id} team={team} teamScores={teamScores.get(team._id)} index={index} />
            ))}
          </tbody>
        </motion.table>
      </div>
    </div>
  );
}

export default TeamStandings;
