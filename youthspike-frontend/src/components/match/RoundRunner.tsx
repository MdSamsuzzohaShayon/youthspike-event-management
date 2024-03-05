import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { UserRole } from '@/types/user';
import React, { useEffect, useState } from 'react';
import { useSocket } from '@/lib/SocketProvider';
import CheckInBox from '../ActionBoxes/CheckInBox';
import InitializeBox from '../ActionBoxes/InitializeBox';
import LineupBox from '../ActionBoxes/LineupBox';
import { EActionProcess } from '@/types/room';



function RoundRunner() {
  /**
   * Step-1: Both team check in -> If a team checked in show your team checked in
   * Step-2: If both team checked in start placing players to the net
   * Step-3: Submit line up one by one team
   * Step-4: If both team submit their line up the net will be locked up they can not change players on the net (All nets of the round need to be locked)
   * Step-5: make submit line up from the next round and showing a prompt to oponent that "Your oponent is waiting for you in the next round to submit your lineup" - Change process from the server
   */
  // Hooks
  const user = useUser();
  const socket = useSocket();

  // Redux State
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { teamA } = useAppSelector((state) => state.teams)

  // Local State
  const [mtp, setMtp] = useState<EActionProcess>(EActionProcess.INITIATE); // mtp = my team process
  const [otp, setOtp] = useState<EActionProcess>(EActionProcess.INITIATE); // otp = Oponent team process


  const renderActionBoxes = (): React.ReactNode => {
    let hasAction: boolean = false;

    // Check if user has action
    if (user && user?.token && (user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain)) {
      hasAction = true;
    }


    switch (mtp) {
      case EActionProcess.INITIATE:
        return <InitializeBox currRoom={currentRoom} socket={socket} user={user} currRound={currentRound} roundList={roundList} mtp={mtp} otp={otp} />

      case EActionProcess.CHECKIN:
        return <CheckInBox currRoom={currentRoom} user={user} socket={socket} roundList={roundList} mtp={mtp} otp={otp} />

      case EActionProcess.LINEUP:
        return <LineupBox currRoom={currentRoom} user={user} socket={socket} mtp={mtp} otp={otp} />

      default:
        break;
    }
  };


  useEffect(() => {
    const teamACapOrCoCap = user.info?.captainplayer === teamA?.captain?._id || user.info?.cocaptainplayer === teamA?.cocaptain?._id
    if (user && user.info && teamACapOrCoCap) {
      if (currentRound?.teamAProcess) setMtp(currentRound.teamAProcess);
      if (currentRound?.teamBProcess) setOtp(currentRound.teamBProcess);
    } else {
      if (currentRound?.teamBProcess) setMtp(currentRound.teamBProcess);
      if (currentRound?.teamAProcess) setOtp(currentRound.teamAProcess);
    }
  }, [currentRound, user, teamA]);

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