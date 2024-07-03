import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds } from '@/redux/slices/matchesSlice';
import findPrevPartner from '../match/findPrevPartner';
import { EPlayerStatus } from '@/types/player';

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

  for (let i = 0; i < currRoundNets.length; i++) {
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
    
    
    // ===== Change partner if if match with previous partner, therefore, 2 players can not play in 2 round in a row =====
    if (matchUp && prevPartnerId && rp2?._id === prevPartnerId) {
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
      const pairScore = (rp1?.rank || 0) + (rp2?.rank || 0);
      const opPairScore = (op1?.rank || 0) + (op2?.rank || 0);
      const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
      const maxPairScore = opPairScore + currMatch.netVariance;

      if (pairScore > maxPairScore && matchUp) {
        // make new logic for it
        rp1 = null;
        rp2 = null;
      } else if (pairScore < minPairScore && matchUp) {
        // make new logic for it
        rp1 = null;
        rp2 = null;
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
