import { IMatch, IMatchExpRel, INetRelatives, IRoundRelatives, ITeam, ITeamScore } from "@/types";
import { calcScore } from "../scoreCalc";
import { MATCH_WIN_POINTS } from "../constant";


export const EMPTY_TEAM_SCORE: ITeamScore = {
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
export function getEntityId(entity?: string | { _id: string } | null): string | null {
    if (!entity) return null;
    return typeof entity === 'object' ? entity._id : String(entity);
}

export function getMatchGroupId(match: IMatchExpRel): string | null {
    return getEntityId(match.group as string | { _id: string } | undefined);
}

/**
 * Groups completed matches by the team ids that played in them.
 */
export function buildMatchesByTeam(matchList: IMatchExpRel[]): Map<string, IMatch[]> {
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
export function groupByMatchId<T extends { match: string }>(items: T[]): Map<string, T[]> {
    const map = new Map<string, T[]>();

    items.forEach((item) => {
        if (!map.has(item.match)) map.set(item.match, []);
        map.get(item.match)!.push(item);
    });

    return map;
}

/**
 * Pure export function: computes a single team's standings record from its
 * completed matches. No side effects, easy to unit test in isolation.
 */
export function computeTeamScore(
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
export function compareTeams(
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