import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IRoom, IRoundRelatives, IUser, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import React from 'react';
import { Socket } from 'socket.io-client';


interface IBoxProps {
    currRoom: IRoom | null;
    currRound: IRoundRelatives | null;
    socket: Socket | null;
    user: null | IUserContext;
    roundList: IRoundRelatives[];
    otp: EActionProcess;
    mtp: EActionProcess;
}
function InitializeBox({ currRoom, socket, user, currRound, roundList, mtp, otp }: IBoxProps) {

    const dispatch = useAppDispatch();
    const { teamA } = useAppSelector((state) => state.teams);


    const initToCheckIn = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!currRoom) return;
        const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
        const actionData: any = {
            room: currRoom._id,
            round: currRound?._id,
            teamAProcess: currRound?.teamAProcess,
            teamBProcess: currRound?.teamBProcess,
        };
        if (isTeamACaptain) {
            actionData.teamAProcess = EActionProcess.CHECKIN
        } else {
            actionData.teamBProcess = EActionProcess.CHECKIN
        }

        // Reset current round, and round list
        const cri = roundList.findIndex((r) => r._id === currRound?._id) // vri = current round index
        if (cri === -1) return;
        const roundObj = { ...roundList[cri], teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess };
        dispatch(setRoundList([...roundList.filter((r) => r._id !== currRound?._id), roundObj]));
        dispatch(setCurrentRound(roundObj));

        if (socket) socket.emit('check-in-from-client', actionData);
    }
    return (
        <div className='flex py-2 w-full flex-col justify-center items-center gap-1'>
            <p>Ensure you have all your players and are ready to play, then check in!</p>
            {mtp === EActionProcess.INITIATE && <button className="btn-primary" type='button' onClick={initToCheckIn} >Check In</button>}
        </div>
    )
}

export default InitializeBox;