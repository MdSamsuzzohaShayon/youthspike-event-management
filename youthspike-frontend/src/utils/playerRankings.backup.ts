import { INetRelatives, IPlayer, IPlayerRankingExpRel, IPlayerRankingItemExpRel } from "@/types";
import { ETeam } from "@/types/team";

const playerRankNum = (rankings: IPlayerRankingItemExpRel[], playerId: string): number => {
  const playerRank = rankings.find((p) => p.player._id === playerId)?.rank || 0;
  return playerRank;
};


interface ICalcRankings {
  myTeamE: ETeam;
  tapr: IPlayerRankingExpRel | null; // Team A Player Ranking
  tbpr: IPlayerRankingExpRel | null; // Team B Player Ranking
}

interface IReturnRankings {
  myRankings: IPlayerRankingItemExpRel[];
  opRankings: IPlayerRankingItemExpRel[];
}

// ===== Organize Ranking ===== 
const organizeRankings = ({ myTeamE, tapr, tbpr }: ICalcRankings): IReturnRankings => {
  const myRankings = [];
  const opRankings = [];
  if (myTeamE === ETeam.teamA) {
    if (tapr) myRankings.push(...tapr.rankings);
    if (tbpr) opRankings.push(...tbpr.rankings);
  } else if (myTeamE === ETeam.teamB) {
    if (tapr) opRankings.push(...tapr.rankings);
    if (tbpr) myRankings.push(...tbpr.rankings);
  }
  return { myRankings, opRankings };
}


interface IOpPlayerRankingNums {
  myTeamE: ETeam;
  opPlayers: IPlayer[];
  currRoundNets: INetRelatives[];
  i: number;
  opRankings: IPlayerRankingItemExpRel[];

}
const opPlayerRankingNums = ({ myTeamE, opPlayers, currRoundNets, i, opRankings }: IOpPlayerRankingNums) => {
  let op1;
  let op2;
  if (myTeamE === ETeam.teamA) {
    op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerA);
    op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerB);
  } else {
    op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerA);
    op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerB);
  }

  const oprp1 = op1?._id ? playerRankNum(opRankings, op1?._id) : 0;
  const oprp2 = op2?._id ? playerRankNum(opRankings, op2?._id) : 0;
  return { oprp1, oprp2 };
}


export { organizeRankings, playerRankNum, opPlayerRankingNums };