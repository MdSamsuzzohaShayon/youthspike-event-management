import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IPlayerRankingItemExpRel } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { ETeam } from '@/types/team';
import { sortPlayerRanking } from '../helper';

interface IOutRange {
  currMatch: IMatchRelatives;
  net?: INetRelatives | null | undefined;
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  myTeamE: ETeam;
  playerSpot: ETeamPlayer;
  teamAPlayerRanking: IPlayerRankingExpRel | null;
  teamBPlayerRanking: IPlayerRankingExpRel | null;
}

const findOutOfRange = ({ currMatch, net, myPlayers, opPlayers, myTeamE, playerSpot, teamAPlayerRanking, teamBPlayerRanking }: IOutRange): string[] => {
  const inavalidPlayerIds = [];
  const netVariance = currMatch.netVariance ? currMatch.netVariance : 0;
  const oponentNetPlayers: IPlayer[] = [];

  // const rankings = teamBPlayerRanking && teamAPlayerRanking ? [...teamAPlayerRanking.rankings, ...teamBPlayerRanking.rankings] : [];
  const rankings = myTeamE === ETeam.teamA ? (teamAPlayerRanking?.rankings || []) : (teamBPlayerRanking?.rankings || []);

  const rankingMap = new Map<string, IPlayerRankingItemExpRel>();
  // eslint-disable-next-line no-restricted-syntax
  for (const ranking of rankings) {
    const findPlayer = myPlayers.find((p)=> p._id === ranking.player?._id);
    if(findPlayer){
      rankingMap.set(ranking.player._id, ranking);
    }
  }


  const opRankings = myTeamE === ETeam.teamA ? (teamBPlayerRanking?.rankings || []) : (teamAPlayerRanking?.rankings || []);
  const opRankingMap = new Map<string, IPlayerRankingItemExpRel>();
  // eslint-disable-next-line no-restricted-syntax
  for (const ranking of opRankings) {
    const findPlayer = opPlayers.find((p)=> p._id === ranking.player?._id);
    if(findPlayer){
      opRankingMap.set(ranking.player._id, ranking);
    }
  }



  // Find pair score
  let oponentPairScore = 0;
  if (myTeamE === ETeam.teamA) {
    if (net?.teamBPlayerA) {
      const findPlayer = opPlayers.find((p) => p._id === net?.teamBPlayerA);
      if (findPlayer) oponentNetPlayers.push(findPlayer);
    }
    if (net?.teamBPlayerB) {
      const findPlayer = opPlayers.find((p) => p._id === net?.teamBPlayerB);
      if (findPlayer) oponentNetPlayers.push(findPlayer);
    }
  } else {
    if (net?.teamAPlayerA) {
      const findPlayer = opPlayers.find((p) => p._id === net?.teamAPlayerA);
      if (findPlayer) oponentNetPlayers.push(findPlayer);
    }
    if (net?.teamAPlayerB) {
      const findPlayer = opPlayers.find((p) => p._id === net?.teamAPlayerB);
      if (findPlayer) oponentNetPlayers.push(findPlayer);
    }
  }

  if (currMatch.extendedOvertime) {
    // Initialize an array to store players with their ranks
    const rankedPlayers = [];

    // Loop through the players and collect their ranks
    for (let i = 0; i < myPlayers.length; i += 1) {
      const playerRank = rankingMap.get(myPlayers[i]._id)?.rank || 0;
      rankedPlayers.push({ player: myPlayers[i], rank: playerRank });
    }

    // Sort the array by rank in descending order
    rankedPlayers.sort((a, b) => a.rank - b.rank);

    if (rankedPlayers.length > 3) {
      // Get all players except the top 3
      const remainingPlayers = rankedPlayers.slice(3);
      for (let i = 0; i < remainingPlayers.length; i += 1) {
        inavalidPlayerIds.push(remainingPlayers[i].player._id);
      }
    }
  } else if (oponentNetPlayers.length > 0) {
    // Find oponent pair score
    for (let i = 0; i < oponentNetPlayers.length; i += 1) {
      // const opr: number | null = rankings.find((p) => p.player._id === oponentNetPlayers[i]?._id)?.rank || null; // opr = oponent player rank
      const opr: number | null = opRankingMap.get(oponentNetPlayers[i]?._id)?.rank || null;
      if (opr) oponentPairScore += opr;
    }

    const startRange = oponentPairScore >= netVariance ? oponentPairScore - netVariance : 0;
    const endRange = oponentPairScore + netVariance;

    let partnerPlayer = null;
    let partnerRank = 0;

    // Find partner
    if (myTeamE === ETeam.teamA) {
      if (playerSpot === ETeamPlayer.PLAYER_A && net?.teamAPlayerB) {
        partnerPlayer = myPlayers.find((p) => p._id === net.teamAPlayerB);
      } else if (playerSpot === ETeamPlayer.PLAYER_B && net?.teamAPlayerA) {
        partnerPlayer = myPlayers.find((p) => p._id === net.teamAPlayerA);
      }
    } else if (playerSpot === ETeamPlayer.PLAYER_A && net?.teamBPlayerB) {
      partnerPlayer = myPlayers.find((p) => p._id === net.teamBPlayerB);
    } else if (playerSpot === ETeamPlayer.PLAYER_B && net?.teamBPlayerA) {
      partnerPlayer = myPlayers.find((p) => p._id === net.teamBPlayerA);
    }

    if (partnerPlayer) {
      const ppr: number | null = rankingMap.get(partnerPlayer?._id)?.rank || null; // ppr = partner player rank
      if (ppr) partnerRank += ppr;
    }

    // Get highest or lowest ranked players
    const mtr = myTeamE === ETeam.teamA ? teamAPlayerRanking?.rankings || [] : teamBPlayerRanking?.rankings || []; // mtr = my team rankings
    const myTopRank = Math.max(...mtr.map((o) => o.rank), 0);
    const myLowRank = Math.min(...mtr.map((o) => o.rank), Infinity);

    // Make players invalid
    let p = 0;
    while (p < myPlayers.length) {
      // eslint-disable-next-line no-loop-func
      const playerRank = rankings.find((mpr) => mpr.player._id === myPlayers[p]._id)?.rank || 0;
      if (myPlayers[p] && playerRank) {
        let ourRank: number = playerRank + partnerRank;
        if (ourRank > endRange) {
          if (!partnerPlayer) {
            ourRank += myLowRank;
            if (ourRank > endRange) {
              inavalidPlayerIds.push(myPlayers[p]._id);
            }
          } else {
            inavalidPlayerIds.push(myPlayers[p]._id);
          }
        } else if (ourRank < startRange) {
          if (!partnerPlayer) {
            ourRank += myTopRank;
            if (ourRank < startRange) {
              inavalidPlayerIds.push(myPlayers[p]._id);
            }
          } else {
            inavalidPlayerIds.push(myPlayers[p]._id);
          }
        }
      }

      p += 1;
    }
  }

  return inavalidPlayerIds;
};

export default findOutOfRange;

