import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { ETeam } from '@/types/team';

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

  const rankings = teamBPlayerRanking && teamAPlayerRanking ? [...teamAPlayerRanking.rankings, ...teamBPlayerRanking.rankings] : [];

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

  if (oponentNetPlayers.length > 0) {
    for (let i = 0; i < oponentNetPlayers.length; i += 1) {
      const opr: number | null = rankings.find((p) => p.player._id === oponentNetPlayers[i]?._id)?.rank || null; // opr = oponent player rank
      if (opr) oponentPairScore += opr;
    }

    const startRange = oponentPairScore >= netVariance ? oponentPairScore - netVariance : 0;
    const endRange = oponentPairScore + netVariance;

    let partnerPlayer = null;
    let partnerRank = 0;

    if (myTeamE === ETeam.teamA) {
      if ((playerSpot === ETeamPlayer.TA_PA || playerSpot === ETeamPlayer.TB_PA) && net?.teamAPlayerB) {
        partnerPlayer = myPlayers.find((p) => p._id === net.teamAPlayerB);
      } else if ((playerSpot === ETeamPlayer.TA_PB || playerSpot === ETeamPlayer.TB_PB) && net?.teamAPlayerA) {
        partnerPlayer = myPlayers.find((p) => p._id === net.teamAPlayerA);
      }
    } else if ((playerSpot === ETeamPlayer.TB_PA || playerSpot === ETeamPlayer.TA_PA) && net?.teamBPlayerB) {
      partnerPlayer = myPlayers.find((p) => p._id === net.teamBPlayerB);
    } else if ((playerSpot === ETeamPlayer.TB_PB || playerSpot === ETeamPlayer.TA_PB) && net?.teamBPlayerA) {
      partnerPlayer = myPlayers.find((p) => p._id === net.teamBPlayerA);
    }

    if (partnerPlayer) {
      const ppr: number | null = rankings.find((p) => p.player._id === partnerPlayer._id)?.rank || null; // ppr = partner player rank
      if (ppr) partnerRank += ppr;
    }

    // const mtrp = rankings.find((p) => p.player._id === partnerPlayer._id)?.rank || null; // ppr = partner player rank
    const mtr = myTeamE === ETeam.teamA ? teamAPlayerRanking?.rankings || [] : teamBPlayerRanking?.rankings || []; // mtr = my team rankings
    const myTopRank = Math.max(...mtr.map((o) => o.rank), 0);
    const myLowRank = Math.min(...mtr.map((o) => o.rank), Infinity);

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
