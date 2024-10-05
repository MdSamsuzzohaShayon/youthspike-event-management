import { setActErr } from '@/redux/slices/elementSlice';
import { setMatchInfo, setVerifyLineup } from '@/redux/slices/matchesSlice';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IJoinTheRoomProps, INextRoundProps, IStatusChange, IRoomNetAssign, IRoundRelatives, INotTwoPointNetProps, IJoinData, ICheckInData } from '@/types';
import { UserRole } from '@/types/user';
import { ETieBreaker } from '@/types/net';
import { EActionProcess, IRoomNetType, ISubmitLineupAction, ITeiBreakerAction } from '@/types/room';
import { ICompleteMatchProps, ISubmitLineupProps, ISubmitUpdatePointsProps, IUpdateMultiplePointsProps } from '@/types/socket';
import { ETeam } from '@/types/team';
import { setMatch } from '../localStorage';

function joinTheRoom({ socket, userInfo, userToken, teamA, teamB, currRound, matchId }: IJoinTheRoomProps) {
  if (!socket || !currRound) return;
  const joinData: IJoinData = { match: matchId, round: currRound._id, userRole: UserRole.public };
  if (!userToken || !userInfo) {
    socket.emit('join-room-from-client', joinData);
    return;
  }
  // if(!userInfo.captainplayer && !userInfo.cocaptainplayer)
  if (userInfo.role !== UserRole.admin && userInfo.role !== UserRole.director && userInfo.role !== UserRole.captain && userInfo.role !== UserRole.co_captain) return;
  if (!teamA || !teamB || (!teamA.captain && !teamA.cocaptain) || (!teamB.captain && !teamB.cocaptain) || !currRound) return;

  let userTeamId = null;
  if ((teamA.captain && userInfo.captainplayer === teamA.captain._id) || (teamA.cocaptain && userInfo.cocaptainplayer === teamA.cocaptain._id)) {
    userTeamId = teamA._id;
  } else if ((teamB.captain && userInfo.captainplayer === teamB.captain._id) || (teamB.cocaptain && userInfo.cocaptainplayer === teamB.cocaptain._id)) {
    userTeamId = teamB._id;
  } else if (userInfo.role === UserRole.admin || userInfo.role === UserRole.director) {
    userTeamId = teamB._id;
  } else {
    return;
  }
  joinData.team = userTeamId;

  if (userInfo) {
    joinData.userRole = userInfo.role;
    joinData.userId = userInfo._id;
  }
  socket.emit('join-room-from-client', joinData);
}

function initToCheckIn({ socket, user, teamA, currRoom, currRound, roundList, dispatch, teamE }: IStatusChange) {
  if (!currRoom || !currRound || !user || !user.info) return;
  const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
  const isTeamACoCaptain = user?.info?.cocaptainplayer === teamA?.cocaptain?._id;
  const adminOrDirector = user?.info?.role === UserRole.admin || user?.info?.role === UserRole.director;
  const actionData: ICheckInData = {
    room: currRoom._id,
    round: currRound._id,
    teamAProcess: currRound.teamAProcess,
    teamBProcess: currRound.teamBProcess,
    userId: user.info._id,
    userRole: user.info.role,
    teamE,
  };
  if (adminOrDirector) {
    if (teamE === ETeam.teamA) {
      actionData.teamAProcess = EActionProcess.CHECKIN;
    } else {
      actionData.teamBProcess = EActionProcess.CHECKIN;
    }
  } else if (isTeamACaptain || isTeamACoCaptain) {
    actionData.teamAProcess = EActionProcess.CHECKIN;
  } else {
    actionData.teamBProcess = EActionProcess.CHECKIN;
  }

  // Reset current round, and round list
  const cri = roundList.findIndex((r) => r._id === currRound?._id); // vri = current round index
  if (cri === -1) return;
  const roundObj = { ...roundList[cri], teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess };
  dispatch(setRoundList([...roundList.filter((r) => r._id !== currRound?._id), roundObj]));
  dispatch(setCurrentRound(roundObj));

  if (socket) socket.emit('check-in-from-client', actionData);
}

function checkInToLineup({ socket, user, teamA, teamB, currRoom, currRound, currRoundNets, roundList, myPlayerIds, dispatch, myTeamE }: ISubmitLineupProps): void {
  if (!user || !user.info || !user.token) return;
  const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
  const isTeamACoCaptain = user?.info?.cocaptainplayer === teamA?.cocaptain?._id;
  const actionData: ISubmitLineupAction = {
    room: currRoom?._id ? currRoom?._id : null,
    round: currRound?._id ? currRound?._id : null,
    match: currRoom?.match ?? null,
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
  if (isTeamACaptain || isTeamACoCaptain) {
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
  const newRoundList = [{ ...roundList[cri], subs: subbedPlayers }, ...roundList.filter((r) => r._id !== currRound?._id)];

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

function lineupToUpdatePoints({ socket, currRoom, currRound, currRoundNets }: ISubmitUpdatePointsProps) {
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

  if (socket) socket.emit('update-points-from-client', { nets: netPointsList, room: currRoom?._id, round: currRound?._id });
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

export { joinTheRoom, checkInToLineup, initToCheckIn, changeTheRound, lineupToUpdatePoints, updateMultiplePoints, notTwoPointNet, completeMatch };
