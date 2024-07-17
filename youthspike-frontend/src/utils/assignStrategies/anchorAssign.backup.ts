import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds } from '@/redux/slices/matchesSlice';
import { EPlayerStatus } from '@/types/player';
import React from 'react';
import findPrevPartner from '../match/findPrevPartner';
import { opPlayerRankingNums, organizeRankings, playerRankNum } from '../playerRankings';

interface IanchorAssignProps {
  matchUp: boolean;
  allNets: INetRelatives[];
  currRoundNets: INetRelatives[];
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  roundList: IRoundRelatives[];
  currRound: IRoundRelatives | null;
  myTeamE: ETeam;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  currMatch: IMatchRelatives;
  tapr: IPlayerRankingExpRel | null; // Team A Player Ranking
  tbpr: IPlayerRankingExpRel | null; // Team B Player Ranking
}

function anchorAssign(props: IanchorAssignProps) {
  const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch, tapr, tbpr } = props;
  const newCurrRoundNets = [];
  const allNetsClone = allNets.slice();
  const selectedPlayerIds = new Set();

  for (let i = 0; i < currRoundNets.length; i += 1) {
    // Make it asscending
    const availablePlayers = myPlayers.filter((player) => !selectedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE);

    if (availablePlayers.length < 2) {
      console.error('Not enough available players');
      break;
    }

    // Get rank 1 and last rank player
    let rp1: null | undefined | IPlayer = availablePlayers[0];
    let rp2: null | undefined | IPlayer = availablePlayers[availablePlayers.length - 1];

    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });

    // ===== Organize Ranking =====
    const { myRankings, opRankings } = organizeRankings({ myTeamE, tapr, tbpr });

    let opPairScore = null;
    if (matchUp) {
      const { oprp1, oprp2 } = opPlayerRankingNums({ currRoundNets, i, myTeamE, opPlayers, opRankings });
      opPairScore = oprp1 + oprp2;
    }

    // ===== Change partner if if match with previous partner, therefore, 2 players can not play in 2 round in a row =====
    if (matchUp && prevPartnerId && rp2?._id === prevPartnerId) {
      rp2 = availablePlayers[availablePlayers.length - 2] || null;
    }

    // ===== Get pair Score =====
    const myrp1 = rp1?._id ? playerRankNum(myRankings, rp1?._id) : 0;
    const myrp2 = rp2?._id ? playerRankNum(myRankings, rp2?._id) : 0;
    const pairScore = myrp1 + myrp2;

    if (currMatch.netVariance && opPairScore) {
      const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
      const maxPairScore = opPairScore + currMatch.netVariance;

      if (pairScore > maxPairScore && matchUp) {
        // make new logic for it
        let found = false;
        let mI = 0;
        const limit = Math.ceil(availablePlayers.length / 2);
        while (limit) {
          const tempP1: null | undefined | IPlayer = availablePlayers[mI + 1];
          const tempRp1 = playerRankNum(myRankings, tempP1._id);
          const tempP2: null | undefined | IPlayer = availablePlayers.find((p) => tempRp1 && playerRankNum(myRankings, p._id) + tempRp1 <= maxPairScore);
          const tempRp2 = tempP2 ? playerRankNum(myRankings, tempP2._id) : 0;
          const nps = (tempRp1 || 0) + (tempRp2 || 0);
          if (nps <= maxPairScore) {
            rp1 = tempP1;
            rp2 = tempP2;
            found = true;
            break;
          }
          mI += 1;
        }
        if (!found) {
          rp1 = null;
          rp2 = null;
        }
      } else if (pairScore < minPairScore && matchUp) {
        // make new logic for it
        let found = false;
        let mI = 0;
        const limit = Math.ceil(availablePlayers.length / 2);
        while (limit) {
          const tempP1: null | IPlayer = availablePlayers[mI + 1];
          const tempP2: null | IPlayer = availablePlayers[availablePlayers.length - (mI + 1)];
          const tempRp1 = playerRankNum(myRankings, tempP1._id);
          const tempRp2 = playerRankNum(myRankings, tempP2._id);
          const nps = (tempRp1 || 0) + (tempRp2 || 0);
          if (nps >= maxPairScore) {
            rp1 = tempP1;
            rp2 = tempP2;
            found = true;
            break;
          }
          mI += 1;
        }
        if (!found) {
          rp1 = null;
          rp2 = null;
        }
      }

      const netObj = { ...currRoundNets[i] };
      if (myTeamE === ETeam.teamA) {
        netObj.teamAPlayerA = rp1?._id || null;
        netObj.teamAPlayerB = rp2?._id || null;
      } else {
        netObj.teamBPlayerA = rp1?._id || null;
        netObj.teamBPlayerB = rp2?._id || null;
      }

      newCurrRoundNets.push(netObj);

      if (rp1) selectedPlayerIds.add(rp1._id);
      if (rp2) selectedPlayerIds.add(rp2._id);

      const fni = allNetsClone.findIndex((n) => n._id === currRoundNets[i]._id);
      if (fni !== -1) {
        allNetsClone[fni] = netObj;
      }
    }
  }

  dispatch(setCurrentRoundNets(newCurrRoundNets));
  dispatch(setNets(allNetsClone));
  // @ts-ignore
  dispatch(setDisabledPlayerIds([...selectedPlayerIds]));
}

export default anchorAssign;
