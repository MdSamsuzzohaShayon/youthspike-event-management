import { setActErr } from "@/redux/slices/elementSlice";
import { setTeamE } from "@/redux/slices/matchesSlice";
import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import { IJoinTheRoomProps, ICanGoProps, ICheckInToLineupProps, INextRoundProps, IStatusChange, IRoomNetAssign, ICheckInAction, IRoundRelatives } from "@/types";
import { EActionProcess, } from "@/types/room";
import { ETeam } from "@/types/team";



function joinTheRoom({ socket, userInfo, userToken, teamA, teamB, currRound, matchId }: IJoinTheRoomProps) {
    if (!socket || !userInfo || !userToken) return;
    const parsedUser = JSON.parse(userInfo);
    if (!parsedUser.captainplayer || !teamA || !teamA.captain || !teamB || !teamB.captain || !currRound) return;

    let userTeamId = null;
    if (parsedUser.captainplayer === teamA.captain._id) {
        userTeamId = teamA._id;
    } else if (parsedUser.captainplayer === teamB.captain._id) {
        userTeamId = teamB._id;
    } else {
        return;
    }
    socket.emit('join-room-from-client', { match: matchId, team: userTeamId, round: currRound._id });
}

function checkInToLineup({ socket, user, teamA, currRoom, currRound, currRoundNets, roundList, dispatch, myTeamE }: ICheckInToLineupProps) {
    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    const actionData: ICheckInAction = {
        room: currRoom?._id ? currRoom?._id : null,
        round: currRound?._id ? currRound?._id : null,
        teamAProcess: currRound?.teamAProcess ? currRound?.teamAProcess : null,
        teamBProcess: currRound?.teamBProcess ? currRound?.teamBProcess : null,
        nets: []
    };
    if (isTeamACaptain) {
        actionData.teamAProcess = EActionProcess.LINEUP;
    } else {
        actionData.teamBProcess = EActionProcess.LINEUP;
    }

    let fillAllNets = true;
    const roundNetAssign: IRoomNetAssign[] = currRoundNets.map((net) => {
        if(myTeamE === ETeam.teamA){
            if (!net.teamAPlayerA || !net.teamAPlayerB ) fillAllNets = false
        }else{
            if(!net.teamBPlayerA || !net.teamBPlayerB) fillAllNets = false;
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
        return dispatch(setActErr({main: "Invalid nets", message: "Every nets must have players!"}));
    };
    actionData.nets = roundNetAssign;

    // Reset current round, and round list
    const cri = roundList.findIndex((r) => r._id === currRound?._id) // vri = current round index
    if (cri === -1) return;
    // @ts-ignore
    const roundObj: IRoundRelatives = { ...roundList[cri], teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess };
    dispatch(setRoundList([...roundList.filter((r) => r._id !== currRound?._id), roundObj]));
    dispatch(setCurrentRound(roundObj));

    if (socket) socket.emit('submit-lineup-from-client', actionData);
}

function initToCheckIn({ socket, user, teamA, currRoom, currRound, roundList, dispatch }: IStatusChange) {
    if (!currRoom) return;
    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    const actionData: any = {
        room: currRoom._id,
        round: currRound?._id,
        teamAProcess: currRound?.teamAProcess,
        teamBProcess: currRound?.teamBProcess,
    };
    if (isTeamACaptain) {
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


function canGoNextOrPrevRound({ currRound, roundList, next, currRoundNets, dispatch}: ICanGoProps): number {
    const findRoundIndex = roundList.findIndex((r) => r._id === currRound?._id);
    if (findRoundIndex === -1) return findRoundIndex;
    let newRoundIndex = 0;
    if (next) {
        let canGoNext = true;
        for (const currNet of currRoundNets) {
            if (!currNet.teamAScore || !currNet.teamBScore) canGoNext = false;
        }
        if (!canGoNext) {
            dispatch(setActErr({ name: "Incomplete round!", message: "Make sure you have completed this round by putting players on all of the nets and points." }));
            return -1;
        }
        if ((!currRound?.teamAScore || currRound?.teamAScore === 0 || !currRound?.teamBScore || currRound?.teamBScore === 0)) return -1;

        if (roundList[findRoundIndex + 1]) {
            newRoundIndex = findRoundIndex + 1;
        }
    } else {
        if (findRoundIndex !== 0) {
            newRoundIndex = findRoundIndex - 1;
        }
    }
    return newRoundIndex;
}

function changeTheRound({ socket, roundList, dispatch, allNets, currRoom, newRoundIndex, myTeamE, currRound }: INextRoundProps) {


    // Current round, current round nets and round list properly
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


    if (socket) socket.emit("round-change-from-client", { room: currRoom?._id, round: currRound?._id, nextRound: newRoundObj._id });
}

export { joinTheRoom, checkInToLineup, initToCheckIn, canGoNextOrPrevRound, changeTheRound };