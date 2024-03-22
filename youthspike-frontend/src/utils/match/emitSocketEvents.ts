import { setActErr } from "@/redux/slices/elementSlice";
import { setTeamE, setVerifyLineup } from "@/redux/slices/matchesSlice";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import { IJoinTheRoomProps, ICanGoProps, ICheckInToLineupProps, INextRoundProps, IStatusChange, IRoomNetAssign, ICheckInAction, IRoundRelatives, INotTwoPointNetProps } from "@/types";
import { ETieBreaker } from "@/types/net";
import { EActionProcess, IRoomNetType, ISubmitLineupAction, ITeiBreakerAction, } from "@/types/room";
import { ISubmitLineupProps, ISubmitUpdatePointsProps, IUpdateMultiplePointsProps } from "@/types/socket";
import { ETeam } from "@/types/team";



function joinTheRoom({ socket, userInfo, userToken, teamA, teamB, currRound, matchId }: IJoinTheRoomProps) {
    if (!socket || !userInfo || !userToken) return;
    const parsedUser = JSON.parse(userInfo);
    if ((!parsedUser.captainplayer && !parsedUser.cocaptainplayer) || !teamA || !teamB || (!teamA.captain && !teamA.cocaptain) || (!teamB.captain && !teamB.cocaptain) || !currRound) return;

    let userTeamId = null;
    if ((teamA.captain && parsedUser.captainplayer === teamA.captain._id) || (teamA.cocaptain && parsedUser.cocaptainplayer === teamA.cocaptain._id)) {
        userTeamId = teamA._id;
    } else if ((teamB.captain && parsedUser.captainplayer === teamB.captain._id) || (teamB.cocaptain && parsedUser.cocaptainplayer === teamB.cocaptain._id)) {
        userTeamId = teamB._id;
    } else {
        return;
    }
    socket.emit('join-room-from-client', { match: matchId, team: userTeamId, round: currRound._id });
}


function initToCheckIn({ socket, user, teamA, currRoom, currRound, roundList, dispatch }: IStatusChange) {
    if (!currRoom) return;
    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    const isTeamACoCaptain = user?.info?.cocaptainplayer === teamA?.cocaptain?._id;
    const actionData: any = {
        room: currRoom._id,
        round: currRound?._id,
        teamAProcess: currRound?.teamAProcess,
        teamBProcess: currRound?.teamBProcess,
    };
    if (isTeamACaptain || isTeamACoCaptain) {
        actionData.teamAProcess = EActionProcess.CHECKIN;
    } else {
        actionData.teamBProcess = EActionProcess.CHECKIN;
    }

    // Reset current round, and round list
    const cri = roundList.findIndex((r) => r._id === currRound?._id) // vri = current round index
    if (cri === -1) return;
    const roundObj = { ...roundList[cri], teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess };
    dispatch(setRoundList([...roundList.filter((r) => r._id !== currRound?._id), roundObj]));
    dispatch(setCurrentRound(roundObj));

    if (socket) socket.emit('check-in-from-client', actionData);
}



function checkInToLineup({ socket, user, teamA, teamB, currRoom, currRound, currRoundNets, roundList, myPlayerIds, dispatch, myTeamE }: ISubmitLineupProps) {
    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    const isTeamACoCaptain = user?.info?.cocaptainplayer === teamA?.cocaptain?._id;
    const actionData: ISubmitLineupAction = {
        room: currRoom?._id ? currRoom?._id : null,
        round: currRound?._id ? currRound?._id : null,
        teamAProcess: currRound?.teamAProcess ? currRound?.teamAProcess : null,
        teamBProcess: currRound?.teamBProcess ? currRound?.teamBProcess : null,
        teamAId: teamA?._id ? teamA?._id : "NO_ID_FOUND",
        teamBId: teamB?._id ? teamB?._id : "NO_ID_FOUND",
        subbedPlayers: [],
        nets: [],
    };
    if (isTeamACaptain || isTeamACoCaptain) {
        actionData.teamAProcess = EActionProcess.LINEUP;
    } else {
        actionData.teamBProcess = EActionProcess.LINEUP;
    }

    let fillAllNets = true;
    const lineupPlayerList = new Set();
    const roundNetAssign: IRoomNetAssign[] = currRoundNets.map((net) => {
        if (myTeamE === ETeam.teamA) {
            lineupPlayerList.add(net.teamAPlayerA);
            lineupPlayerList.add(net.teamAPlayerB);
            if (!net.teamAPlayerA || !net.teamAPlayerB) fillAllNets = false
        } else {
            lineupPlayerList.add(net.teamBPlayerA);
            lineupPlayerList.add(net.teamBPlayerB);
            if (!net.teamBPlayerA || !net.teamBPlayerB) fillAllNets = false;
        }

        return {
            _id: net._id,
            teamAPlayerA: net.teamAPlayerA,
            teamAPlayerB: net.teamAPlayerB,
            teamBPlayerA: net.teamBPlayerA,
            teamBPlayerB: net.teamBPlayerB,
        }
    });
    if (!fillAllNets) {
        return dispatch(setActErr({ main: "Invalid nets", message: "Every nets must have players!" }));
    };
    actionData.nets = roundNetAssign;

    // playerList
    const subbedPlayers = [];
    for (let i = 0; i < myPlayerIds.length; i++) {
        if(!lineupPlayerList.has(myPlayerIds[i])){
            subbedPlayers.push(myPlayerIds[i]);
        }
    }
    actionData.subbedPlayers = subbedPlayers;

    // Reset current round, and round list
    const cri = roundList.findIndex((r) => r._id === currRound?._id) // vri = current round index
    if (cri === -1) return;
    // @ts-ignore
    const roundObj: IRoundRelatives = { ...roundList[cri], teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess, subs: subbedPlayers };
    dispatch(setRoundList([...roundList.filter((r) => r._id !== currRound?._id), roundObj]));
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

    dispatch(setCurrentRound(newRoundObj));
    const newRoundList = roundList.filter((r) => r._id !== newRoundObj._id);
    newRoundList.push(newRoundObj);
    dispatch(setRoundList(newRoundList));
}



function lineupToUpdatePoints({ socket, currRoom, currRound, currRoundNets, }: ISubmitUpdatePointsProps) {
    const netPointsList = [];
    for (const n of currRoundNets) {
        const nObj = {
            _id: n._id,
            teamAScore: n.teamAScore ? n.teamAScore : 0,
            teamBScore: n.teamBScore ? n.teamBScore : 0,
        };
        netPointsList.push(nObj);
    }

    if (socket) socket.emit("update-points-from-client", { nets: netPointsList, room: currRoom?._id, round: currRound?._id });
}

function updateMultiplePoints({ socket, dispatch, allNets, currRoom, currRound, currRoundNets, }: IUpdateMultiplePointsProps) {
    const cloneAN = [...allNets]; // AN = all nets
    const cloneCRN = [...currRoundNets]; // crn = current round nets
    const netPointsList = [];
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

    if (socket) socket.emit("update-points-from-client", { nets: netPointsList, room: currRoom?._id, round: currRound?._id });
}


function notTwoPointNet({ socket, netId, currRoom, currRound, currRoundNets, allNets, dispatch }: INotTwoPointNetProps) {
    const actionData: ITeiBreakerAction = {
        room: currRoom?._id ? currRoom?._id : null,
        round: currRound?._id ? currRound?._id : null,
        teamAProcess: currRound?.teamAProcess ? currRound?.teamAProcess : null,
        teamBProcess: currRound?.teamBProcess ? currRound?.teamBProcess : null,
        nets: []
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
        const lnIds = lockedNets.map((n) => n._id)
        for (let i = 0; i < updatedNets.length; i++) {
            if (!lnIds.includes(updatedNets[i]._id) && updatedNets[i].round === currRound?._id) {
                updatedNets[i] = { ...updatedNets[i], points: 2, netType: ETieBreaker.TIE_BREAKER_NET };
            }
        }

        for (let i = 0; i < updatedAllNets.length; i++) {
            if (!lnIds.includes(updatedAllNets[i]._id ) && updatedAllNets[i].round === currRound?._id) {
                updatedAllNets[i] = { ...updatedAllNets[i], points: 2, netType: ETieBreaker.TIE_BREAKER_NET };
            }
        }
    }

    dispatch(setCurrentRoundNets(updatedNets));
    dispatch(setNets(updatedAllNets));



    const roundNetAssign: IRoomNetType[] = updatedNets.map((net) => ({
        _id: net._id,
        netType: net.netType
    }));
    actionData.nets = roundNetAssign;


    if (socket) socket.emit('update-net-from-client', actionData);
}

export { joinTheRoom, checkInToLineup, initToCheckIn, changeTheRound, lineupToUpdatePoints, updateMultiplePoints, notTwoPointNet };