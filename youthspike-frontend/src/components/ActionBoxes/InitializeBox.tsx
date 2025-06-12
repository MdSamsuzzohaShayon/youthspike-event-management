import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IRoom, IRoundRelatives, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import Image from 'next/image';
import React, { useCallback } from 'react';
import { Socket } from 'socket.io-client';
import EmitEvents from '@/utils/socket/EmitEvents';
import PointText from './PointText';
import { shallow } from 'zustand/shallow'; // Optional optimization

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

  const {
    myTeamE,
    currMatch,
    opTeam,
  } = useAppSelector(
    (state) => ({
      myTeamE: state.matches.myTeamE,
      currMatch: state.matches.match,
      opTeam: state.matches.opTeam,
    }),
    shallow, // avoids unnecessary rerenders if values don't change
  );

  const handleInitToCheckIn = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!socket || !currRoom || !currRound || !user || roundList.length === 0) return;

      const emitEvents = new EmitEvents(socket, dispatch);
      emitEvents.checkIn({ currRoom, socket, currRound, dispatch, myTeamE, roundList, user });
    },
    [socket, currRoom, currRound, dispatch, myTeamE, roundList, user],
  );

  return (
    <div className="py-2 w-full box-success">
      <div className="container px-4 mx-auto flex justify-between items-center gap-1">
        <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
          <PointText txt="Squad check in" />
          <h3>Welcome to your match VS {opTeam?.name}</h3>
          <h2 className="uppercase font-black text-start">{currMatch?.description}</h2>
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
    </div>
  );
}

export default React.memo(InitializeBox); // prevents rerender if props haven't changed
