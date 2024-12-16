/* eslint-disable no-restricted-syntax */
/* eslint-disable react/require-default-props */
import { IMatchExpRel, IPlayer, ITeam } from '@/types';
import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { calcMatchScore } from '@/utils/scoreCalc';
import { ETeam, ITeamScore } from '@/types/team';
import TeamRow from './TeamRow';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface ITeamListProps {
  teamList?: ITeamCaptain[];
  matchList?: IMatch[];
  selectedGroup?: string | null;
}

function TeamList({ teamList, matchList, selectedGroup }: ITeamListProps) {
  const [teamScores, setTeamScores] = useState<Map<string, ITeamScore>>(new Map());
  const [sortedTeams, setSortedTeams] = useState<ITeamCaptain[]>([]);

  const calculateTeamScore = useCallback(() => {
    const newTeamScores: Map<string, ITeamScore> = new Map();

    if (teamList && teamList.length > 0 && matchList) {
      const matchesByTeam = new Map<string, IMatch[]>();
      for (const match of matchList) {
        if (match.teamA._id) {
          matchesByTeam.set(match.teamA._id, [...(matchesByTeam.get(match.teamA._id) || []), match]);
        }
        if (match.teamB._id) {
          matchesByTeam.set(match.teamB._id, [...(matchesByTeam.get(match.teamB._id) || []), match]);
        }
      }

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
        let numOfMatches = 0;
        let numOfRounds = 0;

        for (const match of teamMatches) {
          numOfRounds += match.rounds.length;
          const isTeamA = match.teamA._id === team._id;
          // @ts-ignore
          const { teamScore, oponentScore, teamPlusMinus } = calcMatchScore(match.rounds, match.nets, isTeamA ? ETeam.teamA : ETeam.teamB);

          numOfMatches += 1;
          totalMatchDiff += teamPlusMinus;

          if (teamScore > oponentScore) {
            teamRecord.overallWins += 1;
            if (match?.group?._id) teamRecord.groupWins += 1;
          } else if (oponentScore > teamScore) {
            teamRecord.overallLoses += 1;
            if (match?.group?._id) teamRecord.groupLoses += 1;
          }
        }

        teamRecord.totalMatches = numOfMatches;
        teamRecord.matchAvgDiff = numOfMatches ? totalMatchDiff / numOfMatches : 0;
        teamRecord.gameAvgDiff = numOfRounds ? totalMatchDiff / numOfRounds : 0;

        newTeamScores.set(team._id, teamRecord);
      }
    }

    setTeamScores(newTeamScores);
  }, [teamList, matchList]);

  const rankTeams = useCallback(() => {
    const sortedTeamArray = teamList?.slice().sort((teamA, teamB) => {
      const scoreA = teamScores.get(teamA._id);
      const scoreB = teamScores.get(teamB._id);

      if (!scoreA || !scoreB) return 0;

      if (selectedGroup) {
        if (scoreA.groupLoses !== scoreB.groupLoses) {
          return scoreA.groupLoses - scoreB.groupLoses;
        }
      }
      if (scoreA.overallLoses !== scoreB.overallLoses) {
        return scoreA.overallLoses - scoreB.overallLoses;
      }

      if (scoreA.matchAvgDiff !== scoreB.matchAvgDiff) {
        return scoreB.matchAvgDiff - scoreA.matchAvgDiff;
      }

      if (scoreA.gameAvgDiff !== scoreB.gameAvgDiff) {
        return scoreB.gameAvgDiff - scoreA.gameAvgDiff;
      }

      return 0;
    });

    setSortedTeams(sortedTeamArray || []);
  }, [teamScores, teamList, selectedGroup]);

  useEffect(() => {
    calculateTeamScore();
  }, [teamList, matchList, selectedGroup, calculateTeamScore]);

  useEffect(() => {
    rankTeams();
  }, [teamScores, rankTeams]);

  return (
    <div className="teamList w-full flex flex-col lg:gap-4 bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="overflow-x-auto">
        <motion.table
          className="w-full text-left text-sm text-gray-300 bg-gray-900 rounded-lg overflow-hidden min-w-[600px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Team</th>
              {selectedGroup && <th className="py-3 px-4">Record</th>}
              <th className="py-3 px-4">Match PT DIFF/AVG</th>
              <th className="py-3 px-4">GM PT DIFF/AVG</th>
              <th className="py-3 px-4">Overall</th>
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

export default TeamList;
