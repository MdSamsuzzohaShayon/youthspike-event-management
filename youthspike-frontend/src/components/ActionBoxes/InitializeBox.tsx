import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IRoom, IRoundRelatives, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import Image from 'next/image';
import React from 'react';
import { Socket } from 'socket.io-client';
import EmitEvents from '@/utils/socket/EmitEvents';
import PointText from './PointText';

interface IBoxProps {
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  socket: Socket | null;
  user: null | IUserContext;
  roundList: IRoundRelatives[];
  mtp: EActionProcess;
}
function InitializeBox({ currRoom, socket, user, currRound, roundList, mtp }: IBoxProps) {
  const dispatch = useAppDispatch();
  const { myTeamE } = useAppSelector((state) => state.matches);

  const handleInitToCheckIn = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const emitEvents = new EmitEvents(socket, dispatch);

    // Emit join room event when the socket is available and round list has data
    emitEvents.checkIn({ currRoom, socket, currRound, dispatch, myTeamE, roundList, user });
  };
  return (
    <div className="flex py-2 w-full justify-between items-center gap-1 box-success">
      <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
        <PointText txt="Squad check in" />
        <h3 className="font-script">Welcome to your match</h3>
        <h2 className="uppercase font-black text-start">Gather your players and then enter the match.</h2>
        {mtp === EActionProcess.INITIATE && (
          <button className="btn-light uppercase" type="button" onClick={handleInitToCheckIn}>
            Check In
          </button>
        )}
      </div>
      <div className="hidden md:block w-2/6">
        <Image width={300} height={300} src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  );
}

export default InitializeBox;
