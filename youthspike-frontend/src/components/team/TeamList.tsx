import {
  IMatchExpRel,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  ITeam,
} from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import { calcMatchScore } from "@/utils/scoreCalc";
import { ETeam, ITeamScore } from "@/types/team";
import TeamRow from "./TeamRow";
import Pagination from "../elements/Pagination";
import {
  createNetMapByMatch,
  createRoundMapByMatch,
} from "@/utils/match/mapByMatch";

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

  console.log("Team List ========================");
  console.log({ rounds, nets, teamList, matchList, selectedGroup });

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
    console.log("=== STARTING teamScores calculation ===");
    console.log("teamList:", teamList?.length, teamList);
    console.log("matchesByTeam size:", matchesByTeam?.size);
    console.log("roundMap size:", roundMap?.size);
    console.log("netMap size:", netMap?.size);
    console.log("selectedGroup:", selectedGroup);

    const scores = new Map<string, ITeamScore>();

    for (const team of teamList) {
      console.log(`\n--- Processing team: ${team._id} (${team.name}) ---`);

      const teamMatches = matchesByTeam.get(team._id) || [];
      console.log(`Team matches found: ${teamMatches.length}`, teamMatches);

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
        console.log(`\n  Processing match: ${match._id}`);
        console.log("  Match details:", {
          teamA: match.teamA?._id,
          teamB: match.teamB?._id,
          group: match.group,
        });

        const isTeamA = match.teamA._id === team._id;
        console.log(`  Is team A: ${isTeamA}`);

        // direct lookups instead of filter
        const roundList = roundMapByMatch.get(match._id) || [];
        const allNets = netMapByMatch.get(match._id) || [];

        console.log(`  Rounds found: ${roundList.length}`);
        console.log(`  Nets found: ${allNets.length}`);

        const { teamScore, oponentScore, teamPlusMinus } = calcMatchScore(
          roundList,
          allNets,
          isTeamA ? ETeam.teamA : ETeam.teamB
        );

        console.log("  calcMatchScore result:", {
          teamScore,
          oponentScore,
          teamPlusMinus,
        });

        totalMatchDiff += teamScore - oponentScore;
        totalGameDiff += teamPlusMinus;

        console.log("  Current totals:", {
          totalMatchDiff,
          totalGameDiff,
          totalNets,
        });

        if (teamScore > oponentScore) {
          teamRecord.overallWins++;
          console.log(`  WIN - overallWins: ${teamRecord.overallWins}`);

          if (
            match.group &&
            String(match.group) !== "" &&
            String(match.group) !== "undefined" &&
            (match?.group?._id || match?.group)
          ) {
            teamRecord.groupWins++;
            console.log(`  GROUP WIN - groupWins: ${teamRecord.groupWins}`);
          }
        } else if (oponentScore > teamScore) {
          teamRecord.overallLoses++;
          console.log(`  LOSS - overallLoses: ${teamRecord.overallLoses}`);

          if (
            match.group &&
            String(match.group) !== "" &&
            String(match.group) !== "undefined" &&
            String(match.group) !== undefined &&
            (match?.group?._id || match?.group)
          ) {
            teamRecord.groupLoses++;
            console.log(`  GROUP LOSS - groupLoses: ${teamRecord.groupLoses}`);
          }
        } else {
          console.log("  TIE - no win/loss recorded");
        }

        totalNets += match.nets.length;
        console.log(
          `  Nets in match: ${match.nets.length}, totalNets: ${totalNets}`
        );
      }

      teamRecord.totalMatches = teamMatches.length;
      teamRecord.matchAvgDiff = teamMatches.length
        ? totalMatchDiff / teamMatches.length
        : 0;
      teamRecord.gameAvgDiff = totalNets ? totalGameDiff / totalNets : 0;

      console.log(`\nFinal record for team ${team._id}:`, teamRecord);
      scores.set(team._id, teamRecord);
    }

    console.log("=== COMPLETED teamScores calculation ===");
    console.log("Final scores map:", Array.from(scores.entries()));
    return scores;
  }, [teamList, matchesByTeam, roundMap, netMap, selectedGroup]);
  console.log("Team Scores ========================");
  console.log(teamScores);

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
            <tr className="bg-yellow-500 text-black font-semibold">
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
