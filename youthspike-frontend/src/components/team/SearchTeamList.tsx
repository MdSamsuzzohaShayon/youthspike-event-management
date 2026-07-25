import { IBadge, IMatch, IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, ITeam } from '@/types';
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ITeamScore } from '@/types/team';
import TeamRow from './TeamRow';
import { tableVariant } from '@/utils/animation';
import { calcScore } from '@/utils/scoreCalc';
import { MATCH_WIN_POINTS } from '@/utils/constant';
import { buildMatchesByTeam, compareTeams, computeTeamScore, EMPTY_TEAM_SCORE, groupByMatchId } from '@/utils/team/team-helpers';
import { createBadgeMap } from '@/utils/badge/badge-helpers';

interface ITeamStandingsProps {
  nets?: INetRelatives[];
  rounds?: IRoundRelatives[];
  teamList?: ITeam[];
  matchList?: IMatchExpRel[];
  badges?: IBadge[];
  selectedGroup?: string | null;
}




function TeamStandings({
  teamList = [],
  matchList = [],
  nets = [],
  rounds = [],
  badges = [],
  selectedGroup = null,
}: ITeamStandingsProps) {
  const matchesByTeam = useMemo(() => buildMatchesByTeam(matchList), [matchList]);
  const netsByMatch = useMemo(() => groupByMatchId(nets), [nets]);
  const roundsByMatch = useMemo(() => groupByMatchId(rounds), [rounds]);
  const badgeMap = useMemo(() => createBadgeMap(badges), [badges])

  /**
   * Derived team scores. Previously this lived in useState + useEffect,
   * which is unnecessary for a pure derivation from props and also
   * dropped `selectedGroup` from its dependency list (stale-closure bug:
   * scores wouldn't recompute when the selected group changed).
   */
  const teamScores = useMemo<Map<string, ITeamScore>>(() => {
    const scores = new Map<string, ITeamScore>();

    teamList.forEach((team) => {
      const teamMatches = matchesByTeam.get(team._id) ?? [];
      scores.set(team._id, computeTeamScore(team._id, teamMatches, netsByMatch, roundsByMatch, selectedGroup));
    });

    return scores;
  }, [teamList, matchesByTeam, netsByMatch, roundsByMatch, selectedGroup]);

  const sortedTeams = useMemo<ITeam[]>(() => {
    if (teamScores.size === 0) return [];
    return [...teamList].sort((teamA, teamB) => compareTeams(teamA, teamB, teamScores, selectedGroup));
  }, [teamList, teamScores, selectedGroup]);

  return (
    <div className="teamList w-full flex flex-col rounded-lg shadow-lg">
      <div className="overflow-x-auto">
        <motion.table
          className="w-full text-left text-sm text-gray-300 bg-gray-900 rounded-lg overflow-hidden"
          variants={tableVariant}
          initial="hidden"
          animate="visible"
        >
          <thead>
            <tr className="bg-yellow-logo text-black font-semibold">
              <th className="py-3 px-2">Team</th>
              <th className="py-3 px-2">Matches</th>
              <th className="py-3 px-2">Points</th>
              <th className="py-3 px-2">Overall</th>
              {selectedGroup && <th className="py-3 px-2">Group Record</th>}
              <th className="py-3 px-2">Match PT DIFF/AVG</th>
              <th className="py-3 px-2">GM PT DIFF/AVG</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <TeamRow
                selectedGroup={selectedGroup}
                key={team._id}
                team={team}
                teamScores={teamScores.get(team._id) ?? EMPTY_TEAM_SCORE}
                badge={team?.badge ? badgeMap.get(String(team.badge)) : null}
                index={index}
              />
            ))}
          </tbody>
        </motion.table>
      </div>
    </div>
  );
}

export default TeamStandings;