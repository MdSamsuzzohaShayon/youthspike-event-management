import {
  IMatchExpRel,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  ITeam,
} from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import { ETeam, ITeamScore } from "@/types/team";
import TeamRow from "./TeamRow";
import Pagination from "../elements/Pagination";
import {
  createNetMapByMatch,
  createRoundMapByMatch,
} from "@/utils/match/mapByMatch";
import { calcScore } from "@/utils/scoreCalc";

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface ITeamListProps {
  rounds: IRoundRelatives[];
  nets: INetRelatives[];
  teamList: ITeamCaptain[];
  matchList?: IMatch[]; // Matches without group filter
  selectedGroup?: string | null;
}

const ITEMS_PER_PAGE = 20;

function TeamList({
  rounds,
  nets,
  teamList,
  matchList,
  selectedGroup,
}: ITeamListProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  /**
   * Precompute lookups for rounds and nets
   * O(1) access instead of filtering repeatedly
   */
  const roundMap = useMemo(() => {
    const map = new Map<string, IRoundRelatives>();
    for (const r of rounds) map.set(r._id, r);
    return map;
  }, [rounds]);

  const netMap = useMemo(() => {
    const map = new Map<string, INetRelatives>();
    for (const n of nets) map.set(n._id, n);
    return map;
  }, [nets]);

  const roundMapByMatch = useMemo(
    () => createRoundMapByMatch(rounds),
    [rounds]
  );
  const netMapByMatch = useMemo(() => createNetMapByMatch(nets), [nets]);

  /**
   * Map of matches by team for quick access
   */
  const matchesByTeam = useMemo(() => {
    const map = new Map<string, IMatch[]>();
    if (!matchList?.length) return map;

    for (const match of matchList) {
      // Skip incomplete matches
      if (!match.completed) continue;

      const teamIds = [
        match.teamA?._id ?? String(match.teamA ?? ""),
        match.teamB?._id ?? String(match.teamB ?? ""),
      ].filter(Boolean); // remove empty/null/undefined IDs

      // Avoid duplicates if both teams have same ID (edge case)
      const uniqueTeamIds = Array.from(new Set(teamIds));

      for (const teamId of uniqueTeamIds) {
        if (!map.has(teamId)) {
          map.set(teamId, []);
        }
        map.get(teamId)!.push(match);
      }
    }

    return map;
  }, [matchList]);

  /**
   * Compute scores per team
   */
  const teamScores = useMemo(() => {
    const scores = new Map<string, ITeamScore>();

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

        // direct lookups instead of filter
        const roundList = roundMapByMatch.get(match._id) || [];
        const allNets = netMapByMatch.get(match._id) || [];

        const { matchScore } = calcScore(allNets, roundList);

        const ts = isTeamA ? matchScore.teamAMScore : matchScore.teamBMScore;
        const os = !isTeamA ? matchScore.teamAMScore : matchScore.teamBMScore;
        const teamPlusMinus =
          matchScore.teamAMPlusMinus > matchScore.teamBMPlusMinus
            ? matchScore.teamAMPlusMinus
            : matchScore.teamBMPlusMinus;

        const teamScore = ts + (isTeamA ? match?.teamAP || 0 : 0),
          oponentScore = os + (isTeamA ? match?.teamBP || 0 : 0);

        totalMatchDiff += teamScore - oponentScore;
        totalGameDiff += teamPlusMinus;

        if (teamScore > oponentScore) {
          teamRecord.overallWins++;

          if (
            match.group &&
            String(match.group) !== "" &&
            String(match.group) !== "undefined" &&
            (match?.group?._id || match?.group)
          ) {
            teamRecord.groupWins++;
          }
        } else if (oponentScore > teamScore) {
          teamRecord.overallLoses++;

          if (
            match.group &&
            String(match.group) !== "" &&
            String(match.group) !== "undefined" &&
            String(match.group) !== undefined &&
            (match?.group?._id || match?.group)
          ) {
            teamRecord.groupLoses++;
          }
        } else {
        }

        totalNets += match.nets.length;
      }

      teamRecord.totalMatches = teamMatches.length;
      teamRecord.matchAvgDiff = teamMatches.length
        ? totalMatchDiff / teamMatches.length
        : 0;
      teamRecord.gameAvgDiff = totalNets ? totalGameDiff / totalNets : 0;
      scores.set(team._id, teamRecord);
    }

    return scores;
  }, [teamList, matchesByTeam, roundMap, netMap, selectedGroup]);

  /**
   * Sort by score (not alphabetically) and paginate
   */
  const paginatedSortedTeams = useMemo(() => {
    if (!teamList.length || !teamScores.size) return [];

    const sortedList = [...teamList].sort((teamA, teamB) => {
      const scoreA = teamScores.get(teamA._id)!;
      const scoreB = teamScores.get(teamB._id)!;

      if (selectedGroup) {
        // group-based ranking
        if (scoreA.groupLoses !== scoreB.groupLoses) {
          return scoreA.groupLoses - scoreB.groupLoses;
        }
      }
      if (scoreA.overallLoses !== scoreB.overallLoses) {
        return scoreA.overallLoses - scoreB.overallLoses;
      }

      // tiebreakers
      if (scoreA.matchAvgDiff !== scoreB.matchAvgDiff) {
        return scoreB.matchAvgDiff - scoreA.matchAvgDiff;
      }
      if (scoreA.gameAvgDiff !== scoreB.gameAvgDiff) {
        return scoreB.gameAvgDiff - scoreA.gameAvgDiff;
      }
      return 0;
    });

    // paginate
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedList.slice(start, start + ITEMS_PER_PAGE);
  }, [teamList, teamScores, currentPage, selectedGroup]);

  return (
    <div className="teamList w-full flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300 bg-gray-900 rounded-lg overflow-hidden">
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
            {paginatedSortedTeams.map((team, index) => (
              <TeamRow
                key={team._id}
                selectedGroup={selectedGroup}
                team={team}
                teamScores={teamScores.get(team._id)}
                index={index}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="w-full mt-6">
        <Pagination
          currentPage={currentPage}
          itemList={teamList}
          setCurrentPage={setCurrentPage}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
}

export default TeamList;
