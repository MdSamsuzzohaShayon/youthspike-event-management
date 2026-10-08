import { INetRelatives, IPlayer, IPlayerRankingExpRel, IPlayerRankingItemExpRel } from "@/types";
import { ETeam } from "@/types/team";

// Radaundant
const playerRankNum = (rankingsMap: Map<string, number>, playerId: string): number => {
  return rankingsMap.get(playerId) ?? 0;
};

interface ICalcRankings {
  myTeamE: ETeam;
  teamAPlayerRanking: IPlayerRankingExpRel | null; // Team A Player Ranking
  teamBPlayerRanking: IPlayerRankingExpRel | null; // Team B Player Ranking
}

interface IReturnRankings {
  myRankings: IPlayerRankingItemExpRel[];
  opRankings: IPlayerRankingItemExpRel[];
}

interface IOpPlayerRankingNums {
  myTeamE: ETeam;
  opPlayers: IPlayer[];
  currRoundNets: INetRelatives[];
  i: number;
  opRankingsMap: Map<string, number>; // Ensure opRankingsMap is explicitly declared as Map<string, number>
}

const organizeRankings = ({ myTeamE, teamAPlayerRanking, teamBPlayerRanking }: ICalcRankings): IReturnRankings => {
  const myRankings: IPlayerRankingItemExpRel[] = [];
  const opRankings: IPlayerRankingItemExpRel[] = [];
  if (myTeamE === ETeam.teamA) {
    if (teamAPlayerRanking) myRankings.push(...teamAPlayerRanking.rankings);
    if (teamBPlayerRanking) opRankings.push(...teamBPlayerRanking.rankings);
  } else if (myTeamE === ETeam.teamB) {
    if (teamAPlayerRanking) opRankings.push(...teamAPlayerRanking.rankings);
    if (teamBPlayerRanking) myRankings.push(...teamBPlayerRanking.rankings);
  }
  return { myRankings, opRankings };
};



// Radaundant
const opPlayerRankingNums = ({ myTeamE, opPlayers, currRoundNets, i, opRankingsMap }: IOpPlayerRankingNums) => {
  let op1;
  let op2;
  if (myTeamE === ETeam.teamA) {
    op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerA) || null;
    op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerB) || null;
  } else {
    op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerA) || null;
    op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerB) || null;
  }

  const oprp1 = op1 ? playerRankNum(opRankingsMap, op1._id) : 0;
  const oprp2 = op2 ? playerRankNum(opRankingsMap, op2._id) : 0;
  return { oprp1, oprp2 };
};

export { organizeRankings, playerRankNum, opPlayerRankingNums };
