import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import { INetRelatives, IRoom, IRoundRelatives } from "@/types";
import { IError } from "@/types/elements";
import { EActionProcess } from "@/types/room";
import { ETeam } from "@/types/team";
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

function changeTheRound({ socket, roundList, dispatch, allNets, currRoom, newRoundIndex, myTeamE, currRound }: INextRoundProps): boolean {


    // Current round, current round nets and round list properly
    const newRoundObj = roundList[newRoundIndex];
    const filteredNets = allNets.filter((net) => net.round === newRoundObj._id);
    dispatch(setCurrentRoundNets(filteredNets));

    
    if(myTeamE === ETeam.teamA){
        newRoundObj.teamAProcess = newRoundObj.teamAProcess && newRoundObj.teamAProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamAProcess;
    }else{
        newRoundObj.teamBProcess = newRoundObj.teamBProcess && newRoundObj.teamBProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamBProcess;
    }
    
    dispatch(setCurrentRound(newRoundObj));
    dispatch(setRoundList([...roundList.filter((r)=> r._id !== newRoundObj._id, newRoundObj)]))

    
    if (socket) socket.emit("round-change-from-client", {room: currRoom?._id, round: currRound?._id, nextRound: newRoundObj._id});
    return true;
}

export { changeTheRound, canGoNextOrPrevRound };
