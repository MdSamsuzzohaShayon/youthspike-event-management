import { IMatch, IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, ITeam } from '@/types';
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ITeamScore } from '@/types/team';
import TeamRow from './TeamRow';
import { tableVariant } from '@/utils/animation';
import { calcScore } from '@/utils/scoreCalc';
import { MATCH_WIN_POINTS } from '@/utils/constant';

interface ITeamStandingsProps {
  nets?: INetRelatives[];
  rounds?: IRoundRelatives[];
  teamList?: ITeam[];
  matchList?: IMatchExpRel[];
  selectedGroup?: string | null;
}

const EMPTY_TEAM_SCORE: ITeamScore = {
  rank: 0,
  totalMatches: 0,
  groupMatches: 0,
  overallWins: 0,
  overallLoses: 0,
  groupWins: 0,
  groupLoses: 0,
  matchAvgDiff: 0,
  gameAvgDiff: 0,
};

/**
 * Safely extracts an `_id` from a field that may be populated (object) or
 * unpopulated (raw id string/ObjectId). Returns null instead of the
 * string "undefined" when the field is missing.
 */
function getEntityId(entity?: string | { _id: string } | null): string | null {
  if (!entity) return null;
  return typeof entity === 'object' ? entity._id : String(entity);
}

function getMatchGroupId(match: IMatchExpRel): string | null {
  return getEntityId(match.group as string | { _id: string } | undefined);
}

/**
 * Groups completed matches by the team ids that played in them.
 */
function buildMatchesByTeam(matchList: IMatchExpRel[]): Map<string, IMatch[]> {
  const map = new Map<string, IMatch[]>();

  matchList.forEach((match) => {
    if (!match.completed) return;

    const teamAId = getEntityId(match.teamA);
    const teamBId = getEntityId(match.teamB);

    if (teamAId) {
      if (!map.has(teamAId)) map.set(teamAId, []);
      map.get(teamAId)!.push(match as IMatch);
    }
    if (teamBId) {
      if (!map.has(teamBId)) map.set(teamBId, []);
      map.get(teamBId)!.push(match as IMatch);
    }
  });

  return map;
}

/**
 * Generic grouping helper reused for both nets and rounds, since both
 * shapes are keyed by `match`.
 */
function groupByMatchId<T extends { match: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();

  items.forEach((item) => {
    if (!map.has(item.match)) map.set(item.match, []);
    map.get(item.match)!.push(item);
  });

  return map;
}

/**
 * Pure function: computes a single team's standings record from its
 * completed matches. No side effects, easy to unit test in isolation.
 */
function computeTeamScore(
  teamId: string,
  teamMatches: IMatch[],
  netsByMatch: Map<string, INetRelatives[]>,
  roundsByMatch: Map<string, IRoundRelatives[]>,
  selectedGroup?: string | null,
): ITeamScore {
  const score: ITeamScore = { ...EMPTY_TEAM_SCORE };

  let totalMatchDiff = 0;
  let totalGameDiff = 0;
  let totalNets = 0;
  let totalGroupMatches = 0;

  teamMatches.forEach((match) => {
    const isTeamA = getEntityId(match.teamA) === teamId;
    const matchNets = netsByMatch.get(match._id) ?? [];
    const matchRounds = roundsByMatch.get(match._id) ?? [];

    const { matchScore } = calcScore(matchNets, matchRounds);
    const matchGroupId = getMatchGroupId(match);

    const teamScore = isTeamA ? matchScore.teamAMScore : matchScore.teamBMScore;
    const opponentScore = isTeamA ? matchScore.teamBMScore : matchScore.teamAMScore;
    const isSelectedGroupMatch = !selectedGroup || selectedGroup === matchGroupId;
    const isGroupMatch = Boolean(matchGroupId) && matchGroupId === selectedGroup;

    if (isSelectedGroupMatch) {
      totalGroupMatches += 1;
      totalMatchDiff += teamScore - opponentScore;
      totalGameDiff += isTeamA ? matchScore.teamAMPlusMinus : matchScore.teamBMPlusMinus;
      totalNets += match.nets?.length ?? 0;
    }

    if (teamScore > opponentScore) {
      score.overallWins += 1;
      if (isGroupMatch) score.groupWins += 1;
    } else if (opponentScore > teamScore) {
      score.overallLoses += 1;
      if (isGroupMatch) score.groupLoses += 1;
    }
  });

  score.totalMatches = teamMatches.length;
  score.groupMatches = totalGroupMatches;
  score.matchAvgDiff = totalGroupMatches > 0 ? totalMatchDiff / totalGroupMatches : 0;
  // Guard against divide-by-zero -> NaN when a team has group matches but no recorded nets.
  score.gameAvgDiff = totalNets > 0 ? totalGameDiff / totalNets : 0;

  return score;
}

/**
 * Pure comparator used to rank teams. Extracted so the multi-criteria
 * tie-break logic isn't duplicated per selectedGroup branch.
 */
function compareTeams(
  teamA: ITeam,
  teamB: ITeam,
  teamScores: Map<string, ITeamScore>,
  selectedGroup?: string | null,
): number {
  const scoreA = teamScores.get(teamA._id);
  const scoreB = teamScores.get(teamB._id);
  if (!scoreA || !scoreB) return 0;

  const pointsA = (selectedGroup ? scoreA.groupWins : scoreA.overallWins) * MATCH_WIN_POINTS;
  const pointsB = (selectedGroup ? scoreB.groupWins : scoreB.overallWins) * MATCH_WIN_POINTS;
  if (pointsA !== pointsB) return pointsB - pointsA;

  const matchesA = selectedGroup ? scoreA.groupMatches : scoreA.totalMatches;
  const matchesB = selectedGroup ? scoreB.groupMatches : scoreB.totalMatches;
  const drawsA = Math.max(0, matchesA - scoreA.overallWins - scoreA.overallLoses);
  const drawsB = Math.max(0, matchesB - scoreB.overallWins - scoreB.overallLoses);
  if (drawsA !== drawsB) return drawsB - drawsA;

  const lossesA = selectedGroup ? scoreA.groupLoses : scoreA.overallLoses;
  const lossesB = selectedGroup ? scoreB.groupLoses : scoreB.overallLoses;
  if (lossesA !== lossesB) return lossesA - lossesB;

  if (scoreA.matchAvgDiff !== scoreB.matchAvgDiff) return scoreB.matchAvgDiff - scoreA.matchAvgDiff;
  if (scoreA.gameAvgDiff !== scoreB.gameAvgDiff) return scoreB.gameAvgDiff - scoreA.gameAvgDiff;

  return 0;
}

function TeamStandings({
  teamList = [],
  matchList = [],
  nets = [],
  rounds = [],
  selectedGroup = null,
}: ITeamStandingsProps) {
  const matchesByTeam = useMemo(() => buildMatchesByTeam(matchList), [matchList]);
  const netsByMatch = useMemo(() => groupByMatchId(nets), [nets]);
  const roundsByMatch = useMemo(() => groupByMatchId(rounds), [rounds]);

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