import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { UserRole } from '@/types/user';
import React, { useEffect, useState } from 'react';
import { useSocket } from '@/lib/SocketProvider';
import CheckInBox from '../ActionBoxes/CheckInBox';
import InitializeBox from '../ActionBoxes/InitializeBox';
import LineupBox from '../ActionBoxes/LineupBox';
import { EActionProcess } from '@/types/room';
import CompletedBox from '../ActionBoxes/CompletedBox';
import FinalRoundBox from '../ActionBoxes/FinalRoundBox';


function RoundRunner() {
  // ===== Hooks ===== 
  const user = useUser();
  const socket = useSocket();

  // =====  Redux State ===== 
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { teamA } = useAppSelector((state) => state.teams)
  const { myTeamE } = useAppSelector((state) => state.matches)

  // ===== Local State ===== 
  const [mtp, setMtp] = useState<EActionProcess>(EActionProcess.INITIATE); // mtp = my team process
  const [otp, setOtp] = useState<EActionProcess>(EActionProcess.INITIATE); // otp = Oponent team process


  const renderActionBoxes = (): React.ReactNode => {
    let hasAction: boolean = false;

    // =====  Check if user has action ===== 
    if (user && user?.token && (user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain)) {
      hasAction = true;
    }

    if (currentRound?.num === roundList.length && currentRound.teamAProcess === EActionProcess.LINEUP && currentRound.teamAProcess === EActionProcess.LINEUP){
      return <FinalRoundBox currRoom={currentRoom} socket={socket} otp={otp} myTeamE={myTeamE} />
    }

    if (currentRound?.completed) return <CompletedBox currRoom={currentRoom} socket={socket} />

    switch (mtp) {
      case EActionProcess.INITIATE:
        return <InitializeBox currRoom={currentRoom} socket={socket} user={user} currRound={currentRound} roundList={roundList} mtp={mtp} otp={otp} />

      case EActionProcess.CHECKIN:
        return <CheckInBox currRoom={currentRoom} user={user} socket={socket} roundList={roundList} mtp={mtp} otp={otp} />

      case EActionProcess.LINEUP:
        return <LineupBox currRoom={currentRoom} socket={socket} otp={otp} />

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
      <div className="container px-4 mx-auto my-4 text-center">
        <div className="box w-full flex flex-col justify-center items-center py-2">
          {currentRoom && renderActionBoxes()}
        </div>
      </div>
    </div>
  );
}

export default RoundRunner;