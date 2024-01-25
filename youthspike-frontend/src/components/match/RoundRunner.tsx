import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { UserRole } from '@/types/user';
import { EActionProcess, IError } from '@/types/elements';
import { ETeam, ITeam } from '@/types/team';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from '@/lib/SocketProvider';
import { setCheckedIn, setSubmittedLineup, setTeamProcess } from '@/redux/slices/matchesSlice';
import { setCurrentRound } from '@/redux/slices/roundSlice';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrentRoundNets } from '@/redux/slices/netSlice';
import CheckInBox from '../ActionBoxes/CheckInBox';
import InitializeBox from '../ActionBoxes/InitializeBox';
import LineupBox from '../ActionBoxes/LineupBox';
import LineupSubmittedBox from '../ActionBoxes/LineupSubmittedBox';
import LockedBox from '../ActionBoxes/LockedBox';
import RoundChangeBox from '../ActionBoxes/RoundChangeBox';


interface IRoundRunnerProps {
  team: ITeam | null | undefined;
  teamE: ETeam;
  handleAction: (e: React.SyntheticEvent, team: string | null | undefined, process: string) => void;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  updatePoints: (e: React.SyntheticEvent) => void;
}


function RoundRunner({ team, teamE, handleAction, setActErr, updatePoints }: IRoundRunnerProps) {
  /**
   * Step-1: Both team check in -> If a team checked in show your team checked in
   * Step-2: If both team checked in start placing players to the net
   * Step-3: Submit line up one by one team
   * Step-4: If both team submit their line up the net will be locked up they can not change players on the net (All nets of the round need to be locked)
   * Step-5: make submit line up from the next round and showing a prompt to oponent that "Your oponent is waiting for you in the next round to submit your lineup" - Change process from the server
   */
  // Hooks
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // Redux State
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { myTeamProcess } = useAppSelector((state) => state.matches);


  const renderActionBoxes = (): React.ReactNode => {
    let hasAction: boolean = false;

    // Check if user has action
    if (user && user?.token && user.info?.role === UserRole.captain) {
      hasAction = true;
    }

    if (currentRoom && currentRoom.round !== currentRound?._id) {
      return <RoundChangeBox />

    } else {
      switch (myTeamProcess) {
        case EActionProcess.INITIATE:
          return <InitializeBox currRoom={currentRoom} socket={socket} user={user} />

        case EActionProcess.CHECKIN:
          return <CheckInBox currRoom={currentRoom} user={user} socket={socket} />

        case EActionProcess.LINEUP:
          return <LineupBox currRoom={currentRoom} user={user} socket={socket} />

        case EActionProcess.LINEUP_SUBMITTED:
          return <LineupSubmittedBox />

        case EActionProcess.LOCKED:
          return <LockedBox />

        default:
          break;
      }
    }
  };


  return (
    <div className="w-full">
      <div className="container px-4 mx-auto my-4 bg-gray-900 text-gray-100 text-center">
        <div className="box w-full flex flex-col justify-center items-center py-2">
          {currentRoom && renderActionBoxes()}
        </div>
        {/* <div className="clock bg-red-700 w-full flex justify-center">
          <p className="text-gray-100">05:00</p>
        </div> */}
      </div>
    </div>
  );
}

export default RoundRunner;