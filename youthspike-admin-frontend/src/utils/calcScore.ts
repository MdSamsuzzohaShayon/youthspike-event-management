import { INetRelatives, IRoundRelatives } from "@/types";
import { ETeam } from "@/types/team";

interface IReturnScore {
    score: number;
    plusMinusScore: number;
}

/**
 * Calculate the score and plus-minus for a specific team in a round.
 */
function calcRoundScore(findNets: INetRelatives[], round: IRoundRelatives, teamE: ETeam): IReturnScore {
    let score = 0;
    let plusMinusScore = 0;

    for (const net of findNets) {
        const teamAScore = net.teamAScore || 0;
        const teamBScore = net.teamBScore || 0;

        if (teamE === ETeam.teamA && teamAScore > teamBScore) {
            score += net.points;
        } else if (teamE === ETeam.teamB && teamBScore > teamAScore) {
            score += net.points;
        }
    }

    const teamPoints = teamE === ETeam.teamA ? round.teamAScore || 0 : round.teamBScore || 0;
    const opponentPoints = teamE === ETeam.teamA ? round.teamBScore || 0 : round.teamAScore || 0;

    plusMinusScore = teamPoints - opponentPoints;

    return { score, plusMinusScore };
}


/**
 * Calculate match scores for both teams with optimized filtering.
 */
function calcMatchScore(
    roundList: IRoundRelatives[],
    allNets: INetRelatives[],
    teamE: ETeam,
): {
    teamScore: number;
    oponentScore: number;
    teamPlusMinus: number;
    oponentPlusMinus: number;
} {
    let teamScore = 0;
    let oponentScore = 0;
    let teamPlusMinus = 0;
    let oponentPlusMinus = 0;

    const oponentE = teamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA;

    // Pre-group nets by round ID to reduce filtering overhead
    const netsByRound = new Map<string, INetRelatives[]>();
    for (const net of allNets) {
        // @ts-ignore
        const roundId = net.round?._id || net.round;
        if (!netsByRound.has(roundId)) {
            netsByRound.set(roundId, []);
        }
        netsByRound.get(roundId)!.push(net);
    }

    for (const round of roundList) {
        const netsOfRound = netsByRound.get(round._id) || [];

        // Calculate team and opponent scores in one loop
        const teamResult = calcRoundScore(netsOfRound, round, teamE);
        const oponentResult = calcRoundScore(netsOfRound, round, oponentE);

        teamScore += teamResult.score;
        teamPlusMinus += teamResult.plusMinusScore;
        oponentScore += oponentResult.score;
        oponentPlusMinus += oponentResult.plusMinusScore;
    }

    return {
        teamScore,
        oponentScore,
        teamPlusMinus,
        oponentPlusMinus,
    };
}


export { calcMatchScore };