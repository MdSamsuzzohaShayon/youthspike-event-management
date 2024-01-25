import { useSocket } from '@/lib/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setTeamProcess } from '@/redux/slices/matchesSlice';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { IRoom, IRoundRelatives, IUser, IUserContext } from '@/types';
import { EActionProcess } from '@/types/elements';
import React from 'react';
import { Socket } from 'socket.io-client';


interface IBoxProps {
    currRoom: IRoom | null;
    socket: Socket | null;
    user: null | IUserContext;
}
function InitializeBox({ currRoom, socket, user }: IBoxProps) {

    const dispatch = useAppDispatch();

    const { myTeamProcess, opTeamProcess, } = useAppSelector((state) => state.matches);
    const { teamA } = useAppSelector((state) => state.teams);


    const initToCheckIn = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!currRoom) return;
        const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
        const actionData: any = {
            room: currRoom._id,
            round: currRoom.round,
            teamAProcess: currRoom.teamAProcess,
            teamBProcess: currRoom.teamBProcess,
        };
        if (isTeamACaptain) {
            actionData.teamAProcess = EActionProcess.CHECKIN
        } else {
            actionData.teamAProcess = EActionProcess.CHECKIN
        }

        const currRoomObj = { ...currRoom, teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess }

        dispatch(setCurrentRoom(currRoomObj));
        dispatch(setTeamProcess({ myTeamProcess: EActionProcess.CHECKIN, opTeamProcess }))
        // @ts-ignore
        socket.emit('check-in-from-client', actionData);
    }
    return (
        <div className='flex py-2 w-full flex-col justify-center items-center gap-1'>
            <p>Ensure you have all your players and are ready to play, then check in!</p>
            {myTeamProcess === EActionProcess.INITIATE && <button className="btn-primary" type='button' onClick={initToCheckIn} >Check In</button>}
        </div>
    )
}

export default InitializeBox;