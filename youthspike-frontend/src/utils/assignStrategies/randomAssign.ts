import { IMatchRelatives, INetRelatives, IPlayer, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds, setclosePSCAvailable } from '@/redux/slices/matchesSlice';
import findPrevPartner from '../match/findPrevPartner';

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
}

function getRandomPlayers(availablePlayers: IPlayer[]): [IPlayer | null, IPlayer | null] {
  const shuffled = availablePlayers.sort(() => 0.5 - Math.random());
  return [shuffled.length > 0 ? shuffled[0] : null, shuffled.length > 1 ? shuffled[1] : null];
}

function getRandomPartner(shuffled: IPlayer[], excludeId: string | null, netVariance: number, targetScore: number): IPlayer | null {
  return (
    shuffled.find((p) => {
      if (p.rank && p._id !== excludeId && p.rank + netVariance <= targetScore) {
        return p;
      }
    }) || null
  );
}

function findPairWithMaxScore(availablePlayers: IPlayer[], maxPairScore: number) {
  for (let mI = 0; mI < availablePlayers.length; mI+=1) {
    const tempRp1 = availablePlayers[mI];
    for (let mJ = mI + 1; mJ < availablePlayers.length; mJ+=1) {
      const tempRp2 = availablePlayers[mJ];
      const nps = (tempRp1?.rank || 0) + (tempRp2?.rank || 0);
      if (nps <= maxPairScore) {
        return [tempRp1, tempRp2];
      }
    }
  }
  return [null, null];
}

function findPairWithMinScore(availablePlayers: IPlayer[], minPairScore: number) {
  for (let mI = 0; mI < availablePlayers.length; mI+=1) {
    const tempRp1 = availablePlayers[mI];
    for (let mJ = mI + 1; mJ < availablePlayers.length; mJ+=1) {
      const tempRp2 = availablePlayers[mJ];
      const nps = (tempRp1?.rank || 0) + (tempRp2?.rank || 0);
      if (nps >= minPairScore) {
        return [tempRp1, tempRp2];
      }
    }
  }
  return [null, null];
}


function randomAssign(props: IRandomAssignProps) {
  const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch } = props;
  const newCurrRoundNets = [];
  const allNetsClone = allNets.slice();
  const selectedPlayerIds = new Set();

  for (let i = 0; i < currRoundNets.length; i += 1) {

    // ===== List of players that are not assigned in a net =====
    const availablePlayers = myPlayers.filter((player) => !selectedPlayerIds.has(player._id) && player.rank);

    if (availablePlayers.length < 2) {
      console.error('Not enough available players');
      break;
    }

    // ===== Randomly selecting 2 players =====
    let [rp1, rp2] = getRandomPlayers(availablePlayers);

    // ===== Check not previous partner =====
    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });

    // ===== Change partner if if match with previous partner, therefore, 2 players can not play in 2 round in a row =====
    if (matchUp && prevPartnerId && rp2?._id === prevPartnerId) {
      rp2 = getRandomPartner(availablePlayers, prevPartnerId, currMatch.netVariance || 0, Infinity) || null;
    }

    // ===== Check Net variance does not exceed =====
    const pairScore = (rp1?.rank || 0) + (rp2?.rank || 0);
    let op1;
    let op2;
    if (myTeamE === ETeam.teamA) {
      op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerA);
      op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerB);
    } else {
      op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerA);
      op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerB);
    }
    const opPairScore = (op1?.rank || 0) + (op2?.rank || 0);

    if (currMatch.netVariance) {
      const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
      const maxPairScore = opPairScore + currMatch.netVariance;

      if (pairScore > maxPairScore && matchUp) {
        [rp1, rp2] = findPairWithMaxScore(availablePlayers, maxPairScore);
      } else if (pairScore < minPairScore && matchUp) {
        [rp1, rp2] = findPairWithMinScore(availablePlayers, minPairScore);
        if (!rp1 || !rp2) {
          console.log({ pairScore, opPairScore, maxPairScore, minPairScore, msg: 'Less than minimum' });
        }
      }

      // ===== Set players to the net, if there is no player it will set null =====
      const netObj = { ...currRoundNets[i] };
      if (myTeamE === ETeam.teamA) {
        netObj.teamAPlayerA = rp1?._id || null;
        netObj.teamAPlayerB = rp2?._id || null;
      } else {
        netObj.teamBPlayerA = rp1?._id || null;
        netObj.teamBPlayerB = rp2?._id || null;
      }

      newCurrRoundNets.push(netObj);

      // ===== Adding player to selected players list =====
      if (rp1) selectedPlayerIds.add(rp1._id);
      if (rp2) selectedPlayerIds.add(rp2._id);

      // ===== Update all nets =====
      const fni = allNetsClone.findIndex((n) => n._id === currRoundNets[i]._id);
      if (fni !== -1) {
        allNetsClone[fni] = netObj;
      }
    }
  }


  // ===== Setting nets and disabled players =====
  dispatch(setCurrentRoundNets(newCurrRoundNets));
  dispatch(setNets(allNetsClone));
  // @ts-ignore
  dispatch(setDisabledPlayerIds([...selectedPlayerIds]));
  dispatch(setclosePSCAvailable(true));
}

export default randomAssign;
