import React from 'react';
import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds, setclosePSCAvailable } from '@/redux/slices/matchesSlice';
import { EPlayerStatus } from '@/types/player';
import findPrevPartner from '../match/findPrevPartner';
import { opPlayerRankingNums, organizeRankings, playerRankNum } from '../playerRankings';

interface IRandomAssignProps {
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

function getRandomPlayers(availablePlayers: IPlayer[]): [IPlayer | null, IPlayer | null] {
  // Shuffle array using Fisher-Yates shuffle algorithm
  const shuffled = availablePlayers.slice();
  for (let i = shuffled.length - 1; i > 0; i-=1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return [shuffled.length > 0 ? shuffled[0] : null, shuffled.length > 1 ? shuffled[1] : null];
}

function findPairWithScore(availablePlayers: IPlayer[], targetScore: number, rankingsMap: Map<string, number>, minMax: 'max' | 'min'): [IPlayer | null, IPlayer | null] {
  let bestPair: [IPlayer | null, IPlayer | null] = [null, null];
  let bestScore = minMax === 'max' ? -Infinity : Infinity;

  for (let i = 0; i < availablePlayers.length; i+=1) {
    const playerA = availablePlayers[i];
    for (let j = i + 1; j < availablePlayers.length; j+=1) {
      const playerB = availablePlayers[j];
      const score = playerRankNum(rankingsMap, playerA._id) + playerRankNum(rankingsMap, playerB._id);
      if ((minMax === 'max' && score <= targetScore && score > bestScore) ||
          (minMax === 'min' && score >= targetScore && score < bestScore)) {
        bestPair = [playerA, playerB];
        bestScore = score;
      }
    }
  }
  return bestPair;
}

function randomAssign(props: IRandomAssignProps) {
  const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch, tapr, tbpr } = props;
  const newCurrRoundNets: INetRelatives[] = [];
  const allNetsClone = allNets.slice();
  const selectedPlayerIds = new Set<string>();

  // Precompute player rankings as a Map for O(1) lookup
  const { myRankings, opRankings } = organizeRankings({ myTeamE, tapr, tbpr });
  const myRankingsMap = new Map<string, number>(myRankings.map(item => [item.player._id, item.rank]));
  const opRankingsMap = new Map<string, number>(opRankings.map(item => [item.player._id, item.rank]));

  for (let i = 0; i < currRoundNets.length; i+=1) {
    const availablePlayers = myPlayers.filter(player => !selectedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE);

    if (availablePlayers.length < 2) {
      console.error('Not enough available players');
      break;
    }

    let [rp1, rp2] = getRandomPlayers(availablePlayers);

    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });

    let opPairScore = 0; // Default to 0 if opPairScore is null
    if (matchUp) {
      const { oprp1, oprp2 } = opPlayerRankingNums({ currRoundNets, i, myTeamE, opPlayers, opRankingsMap });
      opPairScore = oprp1 + oprp2;
    }

    if (matchUp && prevPartnerId && rp2?._id === prevPartnerId) {
      const [newRp1, newRp2] = findPairWithScore(availablePlayers, opPairScore, opRankingsMap, 'max');
      rp1 = newRp1 || rp1;
      rp2 = newRp2 || rp2;
    }

    const myrp1 = rp1?._id ? myRankingsMap.get(rp1._id) || 0 : 0;
    const myrp2 = rp2?._id ? myRankingsMap.get(rp2._id) || 0 : 0;
    const pairScore = myrp1 + myrp2;

    if (currMatch.netVariance && opPairScore !== null) {
      const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
      const maxPairScore = opPairScore + currMatch.netVariance;

      if (pairScore > maxPairScore && matchUp) {
        [rp1, rp2] = findPairWithScore(availablePlayers, maxPairScore, opRankingsMap, 'max');
      } else if (pairScore < minPairScore && matchUp) {
        [rp1, rp2] = findPairWithScore(availablePlayers, minPairScore, opRankingsMap, 'min');
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

    const fni = allNetsClone.findIndex(n => n._id === currRoundNets[i]._id);
    if (fni !== -1) {
      allNetsClone[fni] = netObj;
    }
  }

  dispatch(setCurrentRoundNets(newCurrRoundNets));
  dispatch(setNets(allNetsClone));
  dispatch(setDisabledPlayerIds(Array.from(selectedPlayerIds)));
}

export default randomAssign;


/**
 * Explanation of Improvements:
 *
 *  Fisher-Yates Shuffle: Improved the getRandomPlayers function to use the Fisher-Yates shuffle algorithm for better randomness and efficiency.
 *  Pair Selection: Introduced findPairWithScore function to find player pairs based on their scores, optimizing the search for pairs that meet the score criteria (maxPairScore and minPairScore).
 *  Precomputed Rankings: Utilized Map data structure (myRankingsMap and opRankingsMap) for O(1) time complexity in retrieving player rankings, improving overall performance.
 *  Optimized Loops: Refactored loops to minimize unnecessary iterations and ensure efficient pair selection based on given constraints (matchUp, netVariance, etc.).
 *
 * These changes help optimize both time and space complexity by reducing unnecessary computations and ensuring more efficient algorithms for player pairing and net assignment. This should lead to better performance, especially when dealing with larger datasets or frequent calls to the randomAssign function.
 */
