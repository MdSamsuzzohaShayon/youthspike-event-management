import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds } from '@/redux/slices/matchesSlice';
import { EPlayerStatus, IPlayerRank } from '@/types/player';
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
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  currMatch: IMatchRelatives;
  tapr: IPlayerRankingExpRel | null; // Team A Player Ranking
  tbpr: IPlayerRankingExpRel | null; // Team B Player Ranking
}

function anchorAssign(props: IanchorAssignProps) {
  const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch, tapr, tbpr } = props;
  const newCurrRoundNets = [];
  const allNetsClone = allNets.slice();
  const selectedPlayerIds = new Set<string>();

  // Precompute player rankings for O(1) lookup
  const { myRankings, opRankings } = organizeRankings({ myTeamE, tapr, tbpr });
  const myRankingsMap = new Map<string, number>(myRankings.map(({ player, rank }) => [player._id, rank]));
  const opRankingsMap = new Map<string, number>(opRankings.map(({ player, rank }) => [player._id, rank]));

  // Sorting my players and oponent players according to rank
  let mySortedPlayers: IPlayerRank[] = [];
  let opSortedPlayers: IPlayerRank[] = [];
  myPlayers.forEach((mp) => {
    const rank = myRankingsMap.get(mp._id) || 0;
    mySortedPlayers.push({ ...mp, rank });
  });
  mySortedPlayers = mySortedPlayers.sort((a, b) => a.rank - b.rank);
  opPlayers.forEach((mp) => {
    const rank = opRankingsMap.get(mp._id) || 0;
    opSortedPlayers.push({ ...mp, rank });
  });
  opSortedPlayers = opSortedPlayers.sort((a, b) => a.rank - b.rank);
  if (currMatch.extendedOvertime) {
    if (mySortedPlayers.length > 3) {
      mySortedPlayers = mySortedPlayers.slice(0, 3);
    }

    if (opSortedPlayers.length > 3) {
      opSortedPlayers = opSortedPlayers.slice(0, 3);
    }
  }


  for (let i = 0; i < currRoundNets.length; i += 1) {
    const availablePlayers = mySortedPlayers.filter((player) => !selectedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE);

    if (availablePlayers.length < 2) {
      console.error('Not enough available players');
      break;
    }

    let rp1: null | undefined | IPlayer = availablePlayers[0];
    let rp2: null | undefined | IPlayer = availablePlayers[availablePlayers.length - 1];

    const netObj = { ...currRoundNets[i] };

    if (myTeamE === ETeam.teamA) {
      netObj.teamAPlayerA = rp1?._id || null;
      netObj.teamAPlayerB = rp2?._id || null;
    } else {
      netObj.teamBPlayerA = rp1?._id || null;
      netObj.teamBPlayerB = rp2?._id || null;
    }

    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: netObj });

    if (prevPartnerId && rp2?._id === prevPartnerId) {
      rp2 = availablePlayers[availablePlayers.length - 2] || null;
      if (myTeamE === ETeam.teamA) {
        netObj.teamAPlayerB = rp2?._id || null;
      } else {
        netObj.teamBPlayerB = rp2?._id || null;
      }
    }
    
    let opPairScore = null;
    if (matchUp) {
      const { oprp1, oprp2 } = opPlayerRankingNums({ myTeamE, opPlayers, currRoundNets, i, opRankingsMap });
      opPairScore = oprp1 + oprp2;
    }


    const myrp1 = rp1?._id ? playerRankNum(myRankingsMap, rp1?._id) : 0;
    const myrp2 = rp2?._id ? playerRankNum(myRankingsMap, rp2?._id) : 0;
    const pairScore = myrp1 + myrp2;

    if (currMatch.netVariance && opPairScore) {
      const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
      const maxPairScore = opPairScore + currMatch.netVariance;

      // If our pair score is greater than the oponent pair score plus net variance
      if (pairScore > maxPairScore && matchUp) {
        let found = false;
        let mI = 0;
        const limit = Math.ceil(availablePlayers.length / 2);
        while (mI <= limit) {
          const tempP1: null | undefined | IPlayer = availablePlayers[mI + 1];
          const tempRp1 = playerRankNum(myRankingsMap, tempP1?._id);
          const tempP2: null | undefined | IPlayer = availablePlayers.find((p) => tempRp1 && playerRankNum(myRankingsMap, p._id) + tempRp1 <= maxPairScore);
          const tempRp2 = tempP2 ? playerRankNum(myRankingsMap, tempP2._id) : 0;
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
        let found = false;
        let mI = 0;
        const limit = Math.ceil(availablePlayers.length / 2);
        while (mI <= limit) {
          const tempP1: null | undefined | IPlayer = availablePlayers[mI + 1];
          const tempP2: null | undefined | IPlayer = availablePlayers[availablePlayers.length - (mI + 1)];
          const tempRp1 = playerRankNum(myRankingsMap, tempP1?._id);
          const tempRp2 = playerRankNum(myRankingsMap, tempP2?._id);
          const nps = (tempRp1 || 0) + (tempRp2 || 0);
          if (nps >= minPairScore) {
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
    }

    if (myTeamE === ETeam.teamA) {
      netObj.teamAPlayerA = rp1?._id || null;
      netObj.teamAPlayerB = rp2?._id || null;
    } else {
      netObj.teamBPlayerA = rp1?._id || null;
      netObj.teamBPlayerB = rp2?._id || null;
    }

    newCurrRoundNets.push(netObj);

    const fni = allNetsClone.findIndex((n) => n._id === currRoundNets[i]._id);
    if (fni !== -1) {
      allNetsClone[fni] = netObj;
    }

    if (rp1) selectedPlayerIds.add(rp1._id);
    if (rp2) selectedPlayerIds.add(rp2._id);
  }

  dispatch(setCurrentRoundNets(newCurrRoundNets));
  dispatch(setNets(allNetsClone));
  dispatch(setDisabledPlayerIds(Array.from(selectedPlayerIds)));
}

export default anchorAssign;