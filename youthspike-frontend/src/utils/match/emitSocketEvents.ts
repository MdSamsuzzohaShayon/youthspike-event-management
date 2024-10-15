import { setActErr } from '@/redux/slices/elementSlice';
import { setMatchInfo, setVerifyLineup } from '@/redux/slices/matchesSlice';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { INextRoundProps, IRoomNetAssign, IRoundRelatives, INotTwoPointNetProps, IUpdatePointData } from '@/types';
import { ETieBreaker } from '@/types/net';
import { EActionProcess, IRoomNetType, ISubmitLineupAction, ITeiBreakerAction } from '@/types/room';
import { ICompleteMatchProps, ISubmitLineupProps, ISubmitUpdatePointsProps, IUpdateMultiplePointsProps } from '@/types/socket';
import { ETeam } from '@/types/team';
import { setMatch } from '../localStorage';



function checkInToLineup({ socket, user, teamA, teamB, currRoom, currRound, currRoundNets, roundList, myPlayerIds, dispatch, myTeamE }: ISubmitLineupProps): void {
  if (!user || !user.info || !user.token) return;

  const actionData: ISubmitLineupAction = {
    room: currRoom?._id ? currRoom?._id : null,
    round: currRound?._id ? currRound?._id : null,
    match: currRoom?.match,
    teamAProcess: currRound?.teamAProcess ? currRound?.teamAProcess : null,
    teamBProcess: currRound?.teamBProcess ? currRound?.teamBProcess : null,
    teamAId: teamA?._id ? teamA?._id : 'NO_ID_FOUND',
    teamBId: teamB?._id ? teamB?._id : 'NO_ID_FOUND',
    subbedPlayers: [],
    nets: [],
    teamE: myTeamE,
    userRole: user?.info?.role,
    userId: user?.info?._id,
  };

  if (myTeamE === ETeam.teamA) {
    actionData.teamAProcess = EActionProcess.LINEUP;
  } else {
    actionData.teamBProcess = EActionProcess.LINEUP;
  }

  let fillAllNets = true;
  const lineupPlayerList = new Set<string>(); // Specify string type for the Set
  const roundNetAssign: IRoomNetAssign[] = currRoundNets.map((net) => {
    if (myTeamE === ETeam.teamA) {
      if (net.teamAPlayerA) lineupPlayerList.add(net.teamAPlayerA);
      if (net.teamAPlayerB) lineupPlayerList.add(net.teamAPlayerB);
      if (!net.teamAPlayerA || !net.teamAPlayerB) fillAllNets = false;
    } else {
      if (net.teamBPlayerA) lineupPlayerList.add(net.teamBPlayerA);
      if (net.teamBPlayerB) lineupPlayerList.add(net.teamBPlayerB);
      if (!net.teamBPlayerA || !net.teamBPlayerB) fillAllNets = false;
    }

    return {
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA,
      teamAPlayerB: net.teamAPlayerB,
      teamBPlayerA: net.teamBPlayerA,
      teamBPlayerB: net.teamBPlayerB,
    };
  });
  if (!fillAllNets) {
    dispatch(setActErr({ success: false, message: 'Every nets must have players!' }));
    return; // Return here to ensure the function always returns void
  }
  actionData.nets = roundNetAssign;

  // playerList
  const subbedPlayers: string[] = [];
  for (let i = 0; i < myPlayerIds.length; i += 1) {
    if (!lineupPlayerList.has(myPlayerIds[i])) {
      subbedPlayers.push(myPlayerIds[i]);
    }
  }

  // Get all subbed players from current rounds
  const subsOrRound = currRound?.subs ? [...currRound.subs] : [];
  // @ts-ignore
  actionData.subbedPlayers = [...new Set([...subsOrRound, ...subbedPlayers])];

  // Reset current round, and round list
  const cri = roundList.findIndex((r) => r._id === currRound?._id); // vri = current round index
  if (cri === -1) return;
  const roundObj: IRoundRelatives = { ...roundList[cri], teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess, subs: subbedPlayers };

  // Set subbed players
  // const updatedRoundList = [...roundList.filter((r) => r._id !== currRound?._id), roundObj];
  // for (let rI = 0; rI < updatedRoundList.length; rI += 1) {
  //   const nrlObj = { ...updatedRoundList[rI] };
  //   if (nrlObj.num >= (currRound?.num || 0)) {
  //     nrlObj.subs = subbedPlayers;
  //   }
  //   newRoundList.push(nrlObj);
  // }
  const newRoundList = [{ ...roundObj, subs: subbedPlayers }, ...roundList.filter((r) => r._id !== currRound?._id)];

  dispatch(setRoundList(newRoundList));
  dispatch(setCurrentRound(roundObj));
  dispatch(setVerifyLineup(false));

  if (socket) socket.emit('submit-lineup-from-client', actionData);
}

function changeTheRound({ roundList, dispatch, allNets, newRoundIndex, myTeamE }: INextRoundProps) {
  // ===== Current round, current round nets and round list properly =====
  const newRoundObj = { ...roundList[newRoundIndex] };
  const filteredNets = allNets.filter((net) => net.round === newRoundObj._id);
  dispatch(setCurrentRoundNets(filteredNets));

  if (myTeamE === ETeam.teamA) {
    newRoundObj.teamAProcess = newRoundObj.teamAProcess && newRoundObj.teamAProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamAProcess;
  } else {
    newRoundObj.teamBProcess = newRoundObj.teamBProcess && newRoundObj.teamBProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamBProcess;
  }
  setMatch(newRoundObj.match, newRoundObj._id);
  dispatch(setCurrentRound(newRoundObj));
  const newRoundList = roundList.filter((r) => r._id !== newRoundObj._id);
  newRoundList.push(newRoundObj);
  dispatch(setRoundList(newRoundList));
}

function completeMatch({ socket, dispatch, match }: ICompleteMatchProps) {
  dispatch(setMatchInfo({ ...match, completed: false }));
  if (socket) socket.emit('completed-match-from-client', { matchId: match._id });
}

function lineupToUpdatePoints({ socket, currRoom, currRound, currRoundNets, myTeamE }: ISubmitUpdatePointsProps) {
  if (!currRoom || !currRound) {
    console.log('No room or round found!');
    return;
  }
  const netPointsList = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const n of currRoundNets) {
    const nObj = {
      _id: n._id,
      teamAScore: n.teamAScore ? n.teamAScore : 0,
      teamBScore: n.teamBScore ? n.teamBScore : 0,
    };
    netPointsList.push(nObj);
  }

  const actionData: IUpdatePointData = {
    nets: netPointsList,
    room: currRoom?._id ?? 'NO_ROOM_IDFOUND',
    round: currRound?._id ?? 'NO_ROUND_ID_FOUND',
    teamE: myTeamE,
  };

  if (socket) socket.emit('update-points-from-client', actionData);
}

function updateMultiplePoints({ socket, dispatch, allNets, currRoom, currRound, currRoundNets }: IUpdateMultiplePointsProps) {
  const cloneAN = [...allNets]; // AN = all nets
  const cloneCRN = [...currRoundNets]; // crn = current round nets
  const netPointsList = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const n of currRoundNets) {
    const nObj = {
      _id: n._id,
      teamAScore: n.teamAScore ? n.teamAScore : 0,
      teamBScore: n.teamBScore ? n.teamBScore : 0,
    };
    netPointsList.push(nObj);

    // To set current round nets
    const findCRNi = cloneCRN.findIndex((cn) => cn._id === n._id);
    if (findCRNi !== -1) {
      cloneCRN[findCRNi] = { ...cloneCRN[findCRNi], teamAScore: nObj.teamAScore, teamBScore: nObj.teamBScore };
    }

    // to set all round nets
    const findANi = cloneAN.findIndex((an) => an._id === n._id);
    if (findANi !== -1) {
      cloneAN[findANi] = { ...cloneAN[findANi], teamAScore: nObj.teamAScore, teamBScore: nObj.teamBScore };
    }
  }

  dispatch(setCurrentRoundNets(cloneCRN));
  dispatch(setNets(cloneAN));

  if (socket) socket.emit('update-points-from-client', { nets: netPointsList, room: currRoom?._id, round: currRound?._id });
}

function notTwoPointNet({ socket, netId, currRoom, currRound, currRoundNets, allNets, dispatch }: INotTwoPointNetProps) {
  const actionData: ITeiBreakerAction = {
    match: currRound?.match,
    room: currRoom?._id ? currRoom?._id : null,
    round: currRound?._id ? currRound?._id : null,
    teamAProcess: currRound?.teamAProcess ? currRound?.teamAProcess : null,
    teamBProcess: currRound?.teamBProcess ? currRound?.teamBProcess : null,
    nets: [],
  };

  const updatedAllNets = [...allNets];
  const updatedNets = [...currRoundNets];
  const nI = updatedNets.findIndex((n) => n._id === netId);
  const anI = updatedAllNets.findIndex((n) => n._id === netId);
  if (nI === -1 || anI === -1) return;

  updatedAllNets[anI] = { ...updatedAllNets[anI], netType: ETieBreaker.FINAL_ROUND_NET_LOCKED };
  updatedNets[nI] = { ...updatedNets[nI], netType: ETieBreaker.FINAL_ROUND_NET_LOCKED };

  // ===== Create 2 Points Nets =====
  const lockedNets = updatedNets.filter((n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED);
  if (lockedNets.length > 1) {
    const lnIds = lockedNets.map((n) => n._id);
    for (let i = 0; i < updatedNets.length; i += 1) {
      if (!lnIds.includes(updatedNets[i]._id) && updatedNets[i].round === currRound?._id) {
        updatedNets[i] = { ...updatedNets[i], points: 2, netType: ETieBreaker.TIE_BREAKER_NET };
      }
    }

    for (let i = 0; i < updatedAllNets.length; i += 1) {
      if (!lnIds.includes(updatedAllNets[i]._id) && updatedAllNets[i].round === currRound?._id) {
        updatedAllNets[i] = { ...updatedAllNets[i], points: 2, netType: ETieBreaker.TIE_BREAKER_NET };
      }
    }
  }

  dispatch(setCurrentRoundNets(updatedNets));
  dispatch(setNets(updatedAllNets));

  const roundNetAssign: IRoomNetType[] = updatedNets.map((net) => ({
    _id: net._id,
    netType: net.netType,
  }));
  actionData.nets = roundNetAssign;

  if (socket) socket.emit('update-net-from-client', actionData);
}

export { checkInToLineup, changeTheRound, lineupToUpdatePoints, updateMultiplePoints, notTwoPointNet, completeMatch };
