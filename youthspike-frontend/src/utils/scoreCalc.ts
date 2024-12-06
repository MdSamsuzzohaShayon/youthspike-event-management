import { INetRelatives, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';

interface IReturnScore {
  score: number;
  plusMinusScore: number;
}

function calcRoundScore(findNets: INetRelatives[], round: IRoundRelatives, teamE: ETeam): IReturnScore {
  // Remove the teamE declaration here
  let score = 0;
  let plusMinusScore = 0;

  findNets.forEach((net) => {
    const teamAScore = net.teamAScore || 0;
    const teamBScore = net.teamBScore || 0;

    // Dark is oponent team
    if (teamE === ETeam.teamA && teamAScore > teamBScore) {
      score += net.points;
    } else if (teamE === ETeam.teamB && teamBScore > teamAScore) {
      score += net.points;
    }
  });

  const fullPoints = teamE === ETeam.teamA ? round.teamAScore || 0 : round.teamBScore || 0;
  plusMinusScore = fullPoints - (teamE === ETeam.teamA ? round.teamBScore || 0 : round.teamAScore || 0);

  return { score, plusMinusScore };
}

function calcMatchScore(roundList: IRoundRelatives[], allNets: INetRelatives[], teamE: ETeam) {
  let teamScore = 0;
  let oponentScore = 0;
  let teamPlusMinus = 0;
  let oponentPlusMinus = 0;
  const oponentE = teamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA;

  roundList.forEach((r) => {
    // @ts-ignore
    const netsOfRound = allNets.filter((n) => n.round._id === r._id);
    const { score: ts, plusMinusScore: tpms } = calcRoundScore(
      netsOfRound,
      // @ts-ignore
      r,
      teamE,
    );
    const { score: os, plusMinusScore: otms } = calcRoundScore(
      netsOfRound,
      // @ts-ignore
      r,
      oponentE,
    );
    teamScore += ts;
    oponentScore += os;
    teamPlusMinus += tpms;
    oponentPlusMinus += otms;
  });

  return { teamScore, oponentScore, teamPlusMinus, oponentPlusMinus }
}

function calcPairScore(playerA: number | null | undefined, playerB: number | null | undefined): number {
  let ps = 0;
  if (playerA) ps += playerA;
  if (playerB) ps += playerB;
  return ps;
}

export { calcRoundScore, calcPairScore, calcMatchScore };
