import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRoom } from "@/redux/slices/roomSlice";
import { setCurrentRound } from "@/redux/slices/roundSlice";
import { INetRelatives, IRoom, IRoundRelatives } from "@/types";
import { IError } from "@/types/elements";
import { EActionProcess } from "@/types/room";
import { ETeam } from "@/types/team";
import { ReducerAction } from "react";
import { Socket } from "socket.io-client";

interface ICommonProps {
    currRound: IRoundRelatives | null;
    roundList: IRoundRelatives[];

}

interface INextRoundProps extends ICommonProps {
    socket: Socket | null;
    dispatch: React.Dispatch<React.ReducerAction<any>>;
    allNets: INetRelatives[];
    currRoom: IRoom | null;
    newRoundIndex: number;
    myTeamE: ETeam;
    opTeamProcess: EActionProcess
}

interface iCanGoProps extends ICommonProps {
    next: boolean;
    currRoundNets: INetRelatives[];
    setActErr?: React.Dispatch<React.SetStateAction<IError | null>>
}

function canGoNextOrPrevRound({ currRound, roundList, next, currRoundNets, setActErr }: iCanGoProps): number {
    const findRoundIndex = roundList.findIndex((r) => r._id === currRound?._id);
    if (findRoundIndex === -1) return findRoundIndex;
    let newRoundIndex = 0;
    if (next) {
        let canGoNext = true;
        for (const currNet of currRoundNets) {
            if (!currNet.teamAScore || !currNet.teamBScore) canGoNext = false;
        }
        if (!canGoNext) {
            if (setActErr) setActErr({ name: "Incomplete round!", message: "Make sure you have completed this round by putting players on all of the nets and points." })
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

function changeTheRound({ socket, roundList, currRound, dispatch, allNets, currRoom, newRoundIndex, myTeamE }: INextRoundProps): boolean {


    // // Set Round and nets
    // const newRoundObj = roundList[newRoundIndex];
    // dispatch(setCurrentRound(newRoundObj));
    // const filteredNets = allNets.filter((net) => net.round === newRoundObj._id);
    // dispatch(setCurrentRoundNets(filteredNets));


    // // Set Room and Process for Team A and team B
    // const nextRound = roundList[newRoundIndex]._id;
    // const rcd = { room: currRoom?._id, round: currRound?._id, nextRound };
    // if (currRoom) {
    //     const newCurrRoom = { ...currRoom, round: roundList[newRoundIndex]._id };
    //     newCurrRoom.teamAProcess = newRoundObj.teamAProcess && newRoundObj.teamAProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamAProcess;
    //     newCurrRoom.teamBProcess = newRoundObj.teamBProcess && newRoundObj.teamBProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamBProcess;
    //     let myTeamProcess = EActionProcess.CHECKIN, opTeamProcess = EActionProcess.CHECKIN;
    //     if (myTeamE === ETeam.teamA) {
    //         newCurrRoom.teamARound = nextRound;
    //         myTeamProcess = newRoundObj.teamAProcess && newRoundObj.teamAProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamAProcess;
    //         opTeamProcess = newRoundObj.teamBProcess && newRoundObj.teamBProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamBProcess;
    //     } else {
    //         newCurrRoom.teamBRound = nextRound;
    //         myTeamProcess = newRoundObj.teamBProcess && newRoundObj.teamBProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamBProcess;
    //         opTeamProcess = newRoundObj.teamAProcess && newRoundObj.teamAProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamAProcess;
    //     }
    //     dispatch(setCurrentRoom(newCurrRoom));
    //     dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
    // }
    // // @ts-ignore
    // if (socket) socket.emit("round-change-from-client", rcd);
    return true;
}

export { changeTheRound, canGoNextOrPrevRound };
