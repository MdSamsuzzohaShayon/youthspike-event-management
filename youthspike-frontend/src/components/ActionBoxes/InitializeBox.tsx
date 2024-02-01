import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IRoom, IRoundRelatives, IUser, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import { initToCheckIn } from '@/utils/match/emitSocketEvents';
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


    const handleInitToCheckIn = (e: React.SyntheticEvent) => {
        e.preventDefault();
        initToCheckIn({ socket, user, teamA, currRoom, currRound, roundList, dispatch });
    }
    return (
        <div className='flex py-2 w-full flex-col justify-center items-center gap-1'>
            <p>Ensure you have all your players and are ready to play, then check in!</p>
            {mtp === EActionProcess.INITIATE && <button className="btn-primary" type='button' onClick={handleInitToCheckIn} >Check In</button>}
        </div>
    )
}

export default InitializeBox;