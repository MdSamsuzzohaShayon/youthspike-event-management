import { INetRelatives, IRoundRelatives } from "@/types";
import { ETeam } from "@/types/team";

interface IReturnScore {
    score: number;
    plusMinusScore: number;
}

function calcRoundScore(findNets: INetRelatives[], round: IRoundRelatives, dark: boolean, teamE: ETeam): IReturnScore {
    // Remove the teamE declaration here
    let score = 0;
    let plusMinusScore = 0;

    findNets.forEach((net) => {
        const teamAScore = net.teamAScore || 0;
        const teamBScore = net.teamBScore || 0;

        // Dark is oponent team
        if (dark) {
            if (teamE === ETeam.teamA && teamAScore > teamBScore) {
                score += 1;
            } else if (teamE === ETeam.teamB && teamBScore > teamAScore) {
                score += 1;
            }
        } else {
            if (teamE === ETeam.teamA && teamBScore < teamAScore) {
                score += 1;
            } else if (teamE === ETeam.teamB && teamBScore > teamAScore) {
                score += 1;
            }
        }
    });

    const fullPoints = dark ? round.teamBScore || 0 : round.teamAScore || 0;
    plusMinusScore = fullPoints - (dark ? round.teamAScore || 0 : round.teamBScore || 0);

    return { score, plusMinusScore };
}


function calcPairScore (playerA: number | null | undefined, playerB: number | null | undefined): number {
    let ps = 0;
    if (playerA) ps += playerA;
    if (playerB) ps += playerB;
    return ps;
}

export { calcRoundScore, calcPairScore };