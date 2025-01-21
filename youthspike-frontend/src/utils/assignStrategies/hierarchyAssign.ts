/* eslint-disable no-restricted-syntax */
import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import React from 'react';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds } from '@/redux/slices/matchesSlice';
import { EPlayerStatus, IPlayerRank } from '@/types/player';
import findPrevPartner from '../match/findPrevPartner';
import { organizeRankings } from '../playerRankings';

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

  // Organize rankings for my team and oponent team
  const { myRankings, opRankings } = organizeRankings({ myTeamE, tapr, tbpr });

  // Creating maps to be efficient to access players and oponents
  const myRankingsMap = new Map<string, number>(myRankings.map((item) => [item.player._id, item.rank]));
  const opRankingsMap = new Map<string, number>(opRankings.map((item) => [item.player._id, item.rank]));
  let mySortedPlayers: IPlayerRank[] = [];
  myPlayers.forEach((p) => {
    if (p.status === EPlayerStatus.ACTIVE) mySortedPlayers.push({ ...p, rank: myRankingsMap.get(p._id) || 0 });
  });
  mySortedPlayers = mySortedPlayers.sort((a, b) => a.rank - b.rank);
  const opPlayerMap = new Map<string | null | undefined, IPlayerRank>(opPlayers.map((p) => [p._id, { ...p, rank: opRankingsMap.get(p._id) || 0 }]));
  const myPlayerMap = new Map<string | null | undefined, IPlayerRank>(myPlayers.map((p) => [p._id, { ...p, rank: myRankingsMap.get(p._id) || 0 }]));

  const isTeamA = myTeamE === ETeam.teamA;

  for (let i = 0; i < currRoundNets.length; i += 1) {
    // Every time
    const availablePlayers = mySortedPlayers.filter((player) => !selectedPlayerIds.has(player._id));

    if (availablePlayers.length < 2) {
      console.error('Not enough available players');
      break;
    }

    // Get rank 1 and rank 2 player player
    const rp1: null | IPlayerRank = availablePlayers[0];
    let rp2: null | IPlayerRank = availablePlayers[1];

    const netObj = { ...currRoundNets[i] };
    const [playerAKey, playerBKey] = myTeamE === ETeam.teamA ? ['teamAPlayerA', 'teamAPlayerB'] : ['teamBPlayerA', 'teamBPlayerB'];
    // @ts-ignore
    netObj[playerAKey] = rp1?._id || null;
    // @ts-ignore
    netObj[playerBKey] = rp2?._id || null;

    if(currMatch.extendedOvertime) {
      newCurrRoundNets.push(netObj);
      if (rp1) selectedPlayerIds.add(rp1._id);
      if (rp2) selectedPlayerIds.add(rp2._id);
      // eslint-disable-next-line no-continue
      continue;
    }

    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: netObj });

    // ===== Change partner if if match with previous partner, therefore, 2 players can not play in 2 round in a row =====
    if (prevPartnerId && rp2?._id === prevPartnerId) {
      rp2 = availablePlayers[2] || null;

      // If there is 2 available players and they had played together in previous round
      if (!rp2 && availablePlayers.length > 1) {
        // Get previous net
        const prevNet: INetRelatives = newCurrRoundNets[i - 1];
        // @ts-ignore
        if (prevNet) rp2 = myPlayerMap.get(prevNet[playerBKey]) || null;
        // @ts-ignore
        prevNet[playerBKey] = availablePlayers[1]._id;
        newCurrRoundNets[i - 1] = prevNet;
      }
    }

    if (currMatch.netVariance && matchUp) {
      // My player rankings and pair score
      const myrp1 = rp1?.rank || 0;
      const myrp2 = rp2?.rank || 0;
      let pairScore = myrp1 + myrp2;

      // Get opponent pair score
      const [op1, op2] = isTeamA ? [netObj.teamBPlayerA, netObj.teamBPlayerB] : [netObj.teamAPlayerA, netObj.teamAPlayerB];
      const opPairScore = (opPlayerMap.get(op1)?.rank || 0) + (opPlayerMap.get(op2)?.rank || 0);

      // Set limit to set pair
      const minPairScore = Math.max(0, (opPairScore || 0) - currMatch.netVariance);
      const maxPairScore = (opPairScore || 0) + currMatch.netVariance;

      if (pairScore > maxPairScore) {
        // Make new logic that validate maximum score
        for (const ap of availablePlayers) {
          const aps = ap.rank || 0;
          if (myrp1 + aps <= maxPairScore) {
            rp2 = ap;
            pairScore = myrp1 + aps;
            break;
          }
        }
      } else if (pairScore < minPairScore && matchUp) {
        // Make new logic that validate minimum score
        for (const ap of availablePlayers) {
          const aps = ap.rank || 0;
          if (myrp1 + aps >= minPairScore) {
            rp2 = ap;
            pairScore = myrp1 + aps;
            break;
          }
        }
      }
    }

    // Set player in each net
    // @ts-ignore
    netObj[playerAKey] = rp1?._id || null;
    // @ts-ignore
    netObj[playerBKey] = rp2?._id || null;
    newCurrRoundNets.push(netObj);

    // Add to selected players so those players can not be selected again
    if (rp1) selectedPlayerIds.add(rp1._id);
    if (rp2) selectedPlayerIds.add(rp2._id);

    const fni = allNetsClone.findIndex((n) => n._id === netObj._id);
    if (fni !== -1) {
      allNetsClone[fni] = netObj;
    }
  }

  dispatch(setCurrentRoundNets(newCurrRoundNets));
  dispatch(setNets(allNetsClone));
  // @ts-ignore
  dispatch(setDisabledPlayerIds([...selectedPlayerIds]));
}

export default hierarchyAssign;
