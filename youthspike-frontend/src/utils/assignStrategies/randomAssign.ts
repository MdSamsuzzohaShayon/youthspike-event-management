/* eslint-disable no-restricted-syntax */
import React from 'react';
import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds } from '@/redux/slices/matchesSlice';
import { EPlayerStatus, IPlayerRank } from '@/types/player';
import findPrevPartner from '../match/findPrevPartner';
import { opPlayerRankingNums, organizeRankings } from '../playerRankings';

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

// Optimized Fisher-Yates (Knuth) shuffle algorithm for player shuffling
function shufflePlayers(players: IPlayer[]): IPlayer[] {
  const clonedPlayers = [...players];
  for (let i = clonedPlayers.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clonedPlayers[i], clonedPlayers[j]] = [clonedPlayers[j], clonedPlayers[i]];
  }
  return clonedPlayers;
}

// Find pair based on score, optimized using O(1) lookups for ranking values
function findOptimalPair(players: IPlayer[], scoreLimit: number, rankingsMap: Map<string, number>, condition: 'max' | 'min'): [IPlayer | null, IPlayer | null] {
  let bestPair: [IPlayer | null, IPlayer | null] = [null, null];
  let bestScore = condition === 'max' ? -Infinity : Infinity;

  for (let i = 0; i < players.length; i += 1) {
    const playerA = players[i];
    const rankA = rankingsMap.get(playerA._id) ?? 0;

    for (let j = i + 1; j < players.length; j += 1) {
      const playerB = players[j];
      const rankB = rankingsMap.get(playerB._id) ?? 0;
      const totalScore = rankA + rankB;

      const isBetterPair = condition === 'max' ? totalScore <= scoreLimit && totalScore > bestScore : totalScore >= scoreLimit && totalScore < bestScore;

      if (isBetterPair) {
        bestPair = [playerA, playerB];
        bestScore = totalScore;
      }
    }
  }

  return bestPair;
}

function randomAssign(props: IRandomAssignProps) {
  const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch, tapr, tbpr } = props;
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
      mySortedPlayers = mySortedPlayers.slice(0, 3 );
    }

    if (opSortedPlayers.length > 3) {
      opSortedPlayers = opSortedPlayers.slice(0, 3 );
    }
  }

  // Shuffle players to ensure randomness
  const randomizedPlayers = shufflePlayers(mySortedPlayers);

  // Create deep copy of nets
  const allNetsClone = allNets.map((net) => ({ ...net }));
  const newCurrRoundNets: INetRelatives[] = [];

  for (let i = 0; i < currRoundNets.length; i += 1) {
    const availablePlayers = randomizedPlayers.filter((player) => !selectedPlayerIds.has(player._id) && player.status === EPlayerStatus.ACTIVE);

    if (availablePlayers.length < 2) {
      console.error('Not enough available players');
      break;
    }

    // Get the two default players
    let rp1 = availablePlayers[0];
    let rp2 = availablePlayers[1];

    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });

    let opPairScore = 0;
    if (matchUp) {
      const { oprp1, oprp2 } = opPlayerRankingNums({ currRoundNets, i, myTeamE, opPlayers, opRankingsMap });
      opPairScore = oprp1 + oprp2;
    }

    // Partner must not be the partner from the previous round
    if (matchUp && prevPartnerId && rp2?._id === prevPartnerId) {
      const [newRp1, newRp2] = findOptimalPair(availablePlayers, opPairScore, opRankingsMap, 'max');
      rp1 = newRp1 || rp1;
      rp2 = newRp2 || rp2;
    }

    // Getting pair score
    const rp1Rank = myRankingsMap.get(rp1._id) ?? 0;
    let rp2Rank = myRankingsMap.get(rp2._id) ?? 0;
    const pairScore = rp1Rank + rp2Rank;

    // Minimum and maximum score must not exceeds
    if (currMatch.netVariance && opPairScore) {
      const minScore = Math.max(0, opPairScore - currMatch.netVariance);
      const maxScore = opPairScore + currMatch.netVariance;

      if (pairScore > maxScore && matchUp) {
        for (const player of availablePlayers) {
          const playerRank = myRankingsMap.get(player._id) ?? 0;
          if (rp1Rank + playerRank <= maxScore && player._id !== rp1._id) {
            rp2 = player;
            rp2Rank = playerRank;
            break;
          }
        }
      } else if (pairScore < minScore && matchUp) {
        for (const player of availablePlayers) {
          const playerRank = myRankingsMap.get(player._id) ?? 0;
          if (rp1Rank + playerRank >= minScore && player._id !== rp1._id) {
            rp2 = player;
            rp2Rank = playerRank;
            break;
          }
        }
      }
    }

    // Select player to a specific team in a net
    const updatedNet = { ...currRoundNets[i] };
    if (myTeamE === ETeam.teamA) {
      updatedNet.teamAPlayerA = rp1._id || null;
      updatedNet.teamAPlayerB = rp2._id || null;
    } else {
      updatedNet.teamBPlayerA = rp1._id || null;
      updatedNet.teamBPlayerB = rp2._id || null;
    }

    newCurrRoundNets.push(updatedNet);

    // Mark selected players as used
    if (rp1) selectedPlayerIds.add(rp1._id);
    if (rp2) selectedPlayerIds.add(rp2._id);

    const netIndex = allNetsClone.findIndex((net) => net._id === currRoundNets[i]._id);
    if (netIndex !== -1) {
      allNetsClone[netIndex] = updatedNet;
    }
  }

  // Update nets and selected players in redux store
  dispatch(setCurrentRoundNets(newCurrRoundNets));
  dispatch(setNets(allNetsClone));
  dispatch(setDisabledPlayerIds(Array.from(selectedPlayerIds)));
}

export default randomAssign;
