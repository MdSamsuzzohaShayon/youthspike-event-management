import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import React from 'react';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds } from '@/redux/slices/matchesSlice';
import { EPlayerStatus } from '@/types/player';
import findPrevPartner from '../match/findPrevPartner';
import { opPlayerRankingNums, organizeRankings, playerRankNum } from '../playerRankings';

interface IHierarchyAssignProps {
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

function hierarchyAssign(props: IHierarchyAssignProps) {
  const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch, tapr, tbpr } = props;

  // Filter active players once to avoid filtering multiple times
  const activePlayers = myPlayers.filter((player) => player.status === EPlayerStatus.ACTIVE);
  const selectedPlayerIds = new Set<string>();

  // Pre-organize rankings and create maps for fast lookups
  const { myRankings, opRankings } = organizeRankings({ myTeamE, tapr, tbpr });
  const myRankingsMap = new Map<string, number>(myRankings.map((item) => [item.player._id, item.rank]));
  const opRankingsMap = new Map<string, number>(opRankings.map((item) => [item.player._id, item.rank]));
  

  const newCurrRoundNets: INetRelatives[] = [];
  const allNetsClone = [...allNets]; // shallow copy for immutability

  for (let i = 0; i < currRoundNets.length; i += 1) {
    // Filter players who haven't been selected yet
    const availablePlayers = activePlayers.filter((player) => !selectedPlayerIds.has(player._id));

    // Not enough players left, break early
    if (availablePlayers.length < 2) {
      console.error('Not enough available players');
      break;
    }

    // Assign initial players based on rankings
    const rp1 = availablePlayers[0];
    let rp2 = availablePlayers[1];

    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });

    if (matchUp && prevPartnerId && rp2._id === prevPartnerId) {
      rp2 = availablePlayers[2] || null;
    }

    let op1;
    let op2;
    if (myTeamE === ETeam.teamA) {
      op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerA);
      op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerB);
    } else {
      op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerA);
      op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerB);
    }

    if (currMatch.netVariance) {
      const myrp1 = rp1 ? playerRankNum(myRankingsMap, rp1._id) : 0;
      let myrp2 = rp2 ? playerRankNum(myRankingsMap, rp2._id) : 0;

      let opPairScore = 0;
      if (matchUp) {
        const { oprp1, oprp2 } = opPlayerRankingNums({ myTeamE, opPlayers, currRoundNets, i, opRankingsMap });
        opPairScore = oprp1 + oprp2;
      }

      const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
      const maxPairScore = opPairScore + currMatch.netVariance;

      if (myrp1 + myrp2 > maxPairScore) {
        for (const ap of availablePlayers) {
          const aps = playerRankNum(myRankingsMap, ap._id);
          if (myrp1 + aps <= maxPairScore) {
            rp2 = ap;
            myrp2 = aps;
            break;
          }
        }
      } else if (myrp1 + myrp2 < minPairScore) {
        for (const ap of availablePlayers) {
          const aps = playerRankNum(myRankingsMap, ap._id);
          if (myrp1 + aps >= minPairScore) {
            rp2 = ap;
            myrp2 = aps;
            break;
          }
        }
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

    selectedPlayerIds.add(rp1._id);
    if (rp2) selectedPlayerIds.add(rp2._id);

    const fni = allNetsClone.findIndex((n) => n._id === currRoundNets[i]._id);
    if (fni !== -1) {
      allNetsClone[fni] = netObj;
    }
  }

  dispatch(setCurrentRoundNets(newCurrRoundNets));
  dispatch(setNets(allNetsClone));
  dispatch(setDisabledPlayerIds([...selectedPlayerIds]));
}

export default hierarchyAssign;

/*
import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import React from 'react';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds } from '@/redux/slices/matchesSlice';
import { EPlayerStatus } from '@/types/player';
import findPrevPartner from '../match/findPrevPartner';
import { opPlayerRankingNums, organizeRankings, playerRankNum } from '../playerRankings';

interface IHierarchyAssignProps {
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

function hierarchyAssign(props: IHierarchyAssignProps) {
  const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch, tapr, tbpr } = props;
  const newCurrRoundNets = [];
  const allNetsClone = allNets.slice();
  const selectedPlayerIds = new Set();

  for (let i = 0; i < currRoundNets.length; i += 1) {
    const availablePlayers = myPlayers.filter((player) => !selectedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE);

    if (availablePlayers.length < 2) {
      console.error('Not enough available players');
      break;
    }

    // Get rank 1 and last rank player
    let rp1: null | IPlayer = availablePlayers[0];
    let rp2: null | IPlayer = availablePlayers[1];

    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });

    // ===== Organize Ranking =====
    const { myRankings, opRankings } = organizeRankings({ myTeamE, tapr, tbpr });

    const myRankingsMap = new Map<string, number>(myRankings.map((item) => [item.player._id, item.rank]));
    const opRankingsMap = new Map<string, number>(opRankings.map((item) => [item.player._id, item.rank]));

    let opPairScore = null;
    if (matchUp) {
      const { oprp1, oprp2 } = opPlayerRankingNums({ myTeamE, opPlayers, currRoundNets, i, opRankingsMap });
      opPairScore = oprp1 + oprp2;
    }


    // ===== Change partner if if match with previous partner, therefore, 2 players can not play in 2 round in a row =====
    if (matchUp && prevPartnerId && rp2?._id === prevPartnerId) {
      rp2 = availablePlayers[2] || null;
    }

    // Get oponent players
    let op1;
    let op2;
    if (myTeamE === ETeam.teamA) {
      op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerA);
      op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerB);
    } else {
      op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerA);
      op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerB);
    }

    if (currMatch.netVariance) {
      const myrp1 = rp1?._id ? playerRankNum(myRankingsMap, rp1?._id) : 0;
      const myrp2 = rp2?._id ? playerRankNum(myRankingsMap, rp2?._id) : 0;
      let pairScore = myrp1 + myrp2;
      const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
      const maxPairScore = opPairScore  + currMatch.netVariance;

      if (pairScore > maxPairScore && matchUp) {
        // make new logic that validate maximum score
        for (const ap of availablePlayers) { 
          const aps = playerRankNum(myRankingsMap, ap._id) ;
          if(myrp1 + aps <= maxPairScore){
            rp2 = ap;
            pairScore = myrp1 + aps;
            break;
          }
        }
      } else if (pairScore < minPairScore && matchUp) {
        // make new logic that validate minimum score
        for (const ap of availablePlayers) { 
          const aps = playerRankNum(myRankingsMap, ap._id) ;
          if(myrp1 + aps >= minPairScore){
            rp2 = ap;
            pairScore = myrp1 + aps;
            break;
          }
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

export default hierarchyAssign;
*/
