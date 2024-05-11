/* eslint-disable react/require-default-props */
import { useUser } from '@/lib/UserProvider';
import React, { useEffect, useState } from 'react';
import { EActionProcess, IRoom } from '@/types/room';
import { useSocket } from '@/lib/SocketProvider';
import { INetRelatives, IRoundRelatives, ITeam } from '@/types';
import { ETeam } from '@/types/team';
import { ETieBreaker } from '@/types/net';
import CheckInBox from '../ActionBoxes/CheckInBox';
import InitializeBox from '../ActionBoxes/InitializeBox';
import LineupBox from '../ActionBoxes/LineupBox';
import CompletedBox from '../ActionBoxes/CompletedBox';
import FinalRoundBox from '../ActionBoxes/FinalRoundBox';

interface IRoundRunnerProps {
  currentRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
  currentRoom: IRoom;
  teamA?: ITeam | null;
  myTeamE: ETeam;
  currRoundNets: INetRelatives[];
}

function RoundRunner({ currentRound, roundList, currentRoom, teamA, myTeamE, currRoundNets }: IRoundRunnerProps) {
  // ===== Hooks =====
  const user = useUser();
  const socket = useSocket();

  // ===== Local State =====
  const [mtp, setMtp] = useState<EActionProcess>(EActionProcess.INITIATE); // mtp = my team process
  const [otp, setOtp] = useState<EActionProcess>(EActionProcess.INITIATE); // otp = Oponent team process

  const renderActionBoxes = (): React.ReactNode | null => {
    const lockedNets = currRoundNets.filter((n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED);
    

    if (currentRound?.num === roundList.length && currentRound.teamAProcess === EActionProcess.LINEUP && currentRound.teamAProcess === EActionProcess.LINEUP && lockedNets.length < 1){
      return <FinalRoundBox myTeamE={myTeamE} />;
    }


    if (currentRound?.completed) return <CompletedBox />;

    switch (mtp) {
      case EActionProcess.INITIATE:
        return <InitializeBox currRoom={currentRoom} socket={socket} user={user} currRound={currentRound} roundList={roundList} mtp={mtp} />;

      case EActionProcess.CHECKIN:
        return <CheckInBox currRoom={currentRoom} otp={otp} />;

      case EActionProcess.LINEUP:
        return <LineupBox otp={otp} />;

      default:
        break;
    }
    return null;
  };

  useEffect(() => {
    const teamACapOrCoCap = user.info?.captainplayer === teamA?.captain?._id || user.info?.cocaptainplayer === teamA?.cocaptain?._id;
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
        <div className="box w-full flex flex-col justify-center items-center py-2">{currentRoom && renderActionBoxes()}</div>
      </div>
    </div>
  );
}

export default RoundRunner;
