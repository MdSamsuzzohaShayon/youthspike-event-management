import {
  IRoundRelatives, ITeamCaptain, IMatch,
  ITeamScore, ETeam
} from "@/types";
import { useMemo } from "react";
import TeamRow from "./TeamRow";
import { calcMatchScore } from "@/utils/scoreCalc";

interface ITeamListProps {
  teamList?: ITeamCaptain[];
  matchesByTeamId: Map<string, IMatch[]>;
  selectedGroup?: string;
}

function SearchTeamList({
  teamList = [],
  matchesByTeamId,
  selectedGroup,
}: ITeamListProps) {
  
  const teamScores = useMemo(() => {
    const scores = new Map<string, ITeamScore>();

    for (const team of teamList) {
      const teamMatches = matchesByTeamId.get(team._id) || [];

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
        if (!match.completed) continue;
        const teamId: string = typeof match.teamA == "object" ? match.teamA._id : match.teamA;
        const isTeamA = teamId === team._id;

        // direct lookups instead of filter

        const { teamScore, oponentScore, teamPlusMinus } = calcMatchScore(
          match.rounds as unknown as IRoundRelatives[],
          match.nets,
          isTeamA ? ETeam.teamA : ETeam.teamB
        );

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
  }, [teamList, matchesByTeamId, selectedGroup]);

  const sortedTeams = useMemo(() => {
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

    return sortedList;
  }, [teamList, teamScores, selectedGroup]);

  

  return (
    <div className="teamList w-full flex flex-col gap-y-4">
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
            {sortedTeams.map((team, index) => (
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
    </div>
  );
}

export default SearchTeamList;
