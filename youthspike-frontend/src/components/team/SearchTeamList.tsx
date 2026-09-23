// components/team/SearchTeamList.tsx
import { EPlayerStatType, ETeamStatType, IBadge, IMatchExpRel, INetRelatives, IRoundRelatives, ITeam } from '@/types';
import { useCallback, useMemo, useState } from 'react';
import { ITeamScore } from '@/types/team';
import TeamRow from './TeamRow';
import { MATCH_WIN_POINTS } from '@/utils/constant';
import {
  buildMatchesByTeam,
  compareTeams,
  computeTeamScore,
  EMPTY_TEAM_SCORE,
  groupByMatchId,
} from '@/utils/team/team-helpers';
import { createBadgeMap } from '@/utils/badge/badge-helpers';
import SortableHeader from '../elements/SortableHeader';



// Default sort config used when no custom sort has been applied by the user.
// `Team` key is chosen so that no `SortableHeader` (which uses other keys) is marked active.
const DEFAULT_SORT_CONFIG: { key: ETeamStatType; direction: 'asc' | 'desc' } = {
  key: ETeamStatType.Team,
  direction: 'desc',
};

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
  // Sort state - null means "use default compareTeams ordering"
  const [sortConfig, setSortConfig] = useState<{
    key: ETeamStatType;
    direction: 'asc' | 'desc';
  } | null>(null);

  const matchesByTeam = useMemo(() => buildMatchesByTeam(matchList), [matchList]);
  const netsByMatch = useMemo(() => groupByMatchId(nets), [nets]);
  const roundsByMatch = useMemo(() => groupByMatchId(rounds), [rounds]);
  const badgeMap = useMemo(() => createBadgeMap(badges), [badges]);

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
      scores.set(
        team._id,
        computeTeamScore(team._id, teamMatches, netsByMatch, roundsByMatch, selectedGroup, team?.teammatchabsencescount)
      );
    });

    return scores;
  }, [teamList, matchesByTeam, netsByMatch, roundsByMatch, selectedGroup]);

  // Toggle asc/desc when the same column is clicked again, otherwise start with desc.
  const handleSort = useCallback((key: ETeamStatType) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev?.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const sortedTeams = useMemo<ITeam[]>(() => {
    if (teamScores.size === 0) return [];

    // Default behavior: use the existing multi-criteria compareTeams comparator.
    if (!sortConfig) {
      return [...teamList].sort((teamA, teamB) =>
        compareTeams(teamA, teamB, teamScores, selectedGroup)
      );
    }

    // Custom column sort driven by user clicks.
    return [...teamList].sort((teamA, teamB) => {
      const scoreA = teamScores.get(teamA._id);
      const scoreB = teamScores.get(teamB._id);

      if (!scoreA || !scoreB) return 0;

      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortConfig.key) {
        case ETeamStatType.Team:
          aValue = (teamA.name || '').toLowerCase().trim();
          bValue = (teamB.name || '').toLowerCase().trim();
          break;

        case ETeamStatType.GroupPointsPerMatch: {
          if (!selectedGroup) return 0;
          const groupDrawsA = Math.max(
            0,
            scoreA.groupMatches - scoreA.groupWins - scoreA.groupLoses
          );
          const groupDrawsB = Math.max(
            0,
            scoreB.groupMatches - scoreB.groupWins - scoreB.groupLoses
          );
          const groupPointsA = scoreA.groupWins * MATCH_WIN_POINTS + groupDrawsA;
          const groupPointsB = scoreB.groupWins * MATCH_WIN_POINTS + groupDrawsB;
          aValue = scoreA.groupMatches > 0 ? groupPointsA / scoreA.groupMatches : 0;
          bValue = scoreB.groupMatches > 0 ? groupPointsB / scoreB.groupMatches : 0;
          break;
        }

        case ETeamStatType.GroupRecord: {
          if (!selectedGroup) return 0;
          const groupDrawsA = Math.max(
            0,
            scoreA.groupMatches - scoreA.groupWins - scoreA.groupLoses
          );
          const groupDrawsB = Math.max(
            0,
            scoreB.groupMatches - scoreB.groupWins - scoreB.groupLoses
          );
          aValue = scoreA.groupWins * MATCH_WIN_POINTS + groupDrawsA;
          bValue = scoreB.groupWins * MATCH_WIN_POINTS + groupDrawsB;
          break;
        }

        case ETeamStatType.OverallRecord: {
          const drawsA = Math.max(
            0,
            scoreA.totalMatches - scoreA.overallWins - scoreA.overallLoses
          );
          const drawsB = Math.max(
            0,
            scoreB.totalMatches - scoreB.overallWins - scoreB.overallLoses
          );
          aValue = scoreA.overallWins * MATCH_WIN_POINTS + drawsA;
          bValue = scoreB.overallWins * MATCH_WIN_POINTS + drawsB;
          break;
        }

        case ETeamStatType.GroupMatches:
          aValue = scoreA.groupMatches;
          bValue = scoreB.groupMatches;
          break;

        case ETeamStatType.MatchAvgDiff:
          aValue = scoreA.matchAvgDiff;
          bValue = scoreB.matchAvgDiff;
          break;

        case ETeamStatType.GameAvgDiff:
          aValue = scoreA.gameAvgDiff;
          bValue = scoreB.gameAvgDiff;
          break;

        default:
          return 0;
      }

      // String comparison (used for team names)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Numeric comparison
      return sortConfig.direction === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [teamList, teamScores, selectedGroup, sortConfig]);

  // Provide a stable non-null sort config to SortableHeader so its prop type is satisfied.
  // When `sortConfig` is null (default state), this falls back to DEFAULT_SORT_CONFIG
  // whose `key` is `ETeamStatType.Team` — a key not used by any SortableHeader — so no
  // header is rendered as actively sorted, matching the "default ordering" state.
  const currentSort = sortConfig ?? DEFAULT_SORT_CONFIG;

  return (
    <div className="teamList w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <div className="min-w-[1000px] w-full">
          <div className="relative w-full">
            <table
              className="w-full text-left text-sm text-gray-300 bg-gray-900"
            >
              <thead>
                <tr className="bg-yellow-logo text-black font-semibold">
                  <th className="py-3 px-3 sticky left-0 top-0 shadow-md z-20 bg-yellow-logo min-w-[120px] max-w-[120px]">
                    Team
                  </th>

                  {selectedGroup && (
                    <SortableHeader
                      label="GP Points/Match"
                      sortKey={ETeamStatType.GroupPointsPerMatch}
                      currentSort={currentSort}
                      onSort={(key: ETeamStatType | EPlayerStatType) => handleSort(key as ETeamStatType)}
                    />
                  )}

                  {selectedGroup && (
                    <SortableHeader
                      label="Group Record"
                      sortKey={ETeamStatType.GroupRecord}
                      currentSort={currentSort}
                      onSort={(key: ETeamStatType | EPlayerStatType) => handleSort(key as ETeamStatType)}
                    />
                  )}

                  <SortableHeader
                    label="Overall Records"
                    sortKey={ETeamStatType.OverallRecord}
                    currentSort={currentSort}
                    onSort={(key: ETeamStatType | EPlayerStatType) => handleSort(key as ETeamStatType)}
                  />

                  {selectedGroup && (
                    <SortableHeader
                      label="Group Matches"
                      sortKey={ETeamStatType.GroupMatches}
                      currentSort={currentSort}
                      onSort={(key: ETeamStatType | EPlayerStatType) => handleSort(key as ETeamStatType)}
                    />
                  )}

                  <SortableHeader
                    label="Match PT DIFF/AVG"
                    sortKey={ETeamStatType.MatchAvgDiff}
                    currentSort={currentSort}
                    onSort={(key: ETeamStatType | EPlayerStatType) => handleSort(key as ETeamStatType)}
                  />

                  <SortableHeader
                    label="GM PT DIFF/AVG"
                    sortKey={ETeamStatType.GameAvgDiff}
                    currentSort={currentSort}
                    onSort={(key: ETeamStatType | EPlayerStatType) => handleSort(key as ETeamStatType)}
                  />
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
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamStandings;