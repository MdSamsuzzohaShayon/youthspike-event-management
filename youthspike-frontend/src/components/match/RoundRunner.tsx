/* eslint-disable react/require-default-props */
import { useUser } from '@/lib/UserProvider';
import React, { useCallback, useEffect, useState } from 'react';
import { EActionProcess, IRoom } from '@/types/room';
import { useSocket } from '@/lib/SocketProvider';
import { INetRelatives, IRoundRelatives, ITeam } from '@/types';
import { ETeam } from '@/types/team';
import { ETieBreaker } from '@/types/net';
import { useAppSelector } from '@/redux/hooks';
import { ETieBreakingStrategy } from '@/types/match';
import CheckInBox from '../ActionBoxes/CheckInBox';
import InitializeBox from '../ActionBoxes/InitializeBox';
import LineupBox from '../ActionBoxes/LineupBox';
import CompletedBox from '../ActionBoxes/CompletedBox';
import FinalRoundBox from '../ActionBoxes/FinalRoundBox';
import AskOvertimeScore from '../ActionBoxes/AskOvertimeScore';
import OvertimeBox from '../ActionBoxes/OvertimeBox';

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
  const { match, teamATotalScore, teamBTotalScore } = useAppSelector((state) => state.matches);

  // ===== Local State =====
  const [mtp, setMtp] = useState<EActionProcess>(EActionProcess.INITIATE); // mtp = my team process
  const [otp, setOtp] = useState<EActionProcess>(EActionProcess.INITIATE); // otp = Oponent team process

  const renderActionBoxes = useCallback((): React.ReactNode | null => {
    const isFinalRound = currentRound?.num === roundList.length;

    const lockedNets = currRoundNets.filter((net) => net.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED);

    if (
      isFinalRound &&
      currentRound?.teamAProcess === EActionProcess.LINEUP &&
      currentRound?.teamBProcess === EActionProcess.LINEUP &&
      lockedNets.length <= 1 &&
      match.tieBreaking === ETieBreakingStrategy.TWO_POINTS_NET
    ) {
      return <FinalRoundBox myTeamE={myTeamE} />;
    }

    // Check both teams points are same
    if (isFinalRound && currentRound?.completed && match.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND && teamATotalScore === teamBTotalScore) {
      return <AskOvertimeScore currRoom={currentRoom} currRound={currentRound} />;
    }

    if (match.extendedOvertime && currentRound?.teamAProcess !== EActionProcess.LINEUP && currentRound?.teamBProcess !== EActionProcess.LINEUP) {
      return <OvertimeBox currRoom={currentRoom} />;
    }

    // Main round completed
    if (currentRound?.completed) {
      return <CompletedBox />;
    }

    switch (mtp) {
      case EActionProcess.INITIATE:
        return <InitializeBox currRoom={currentRoom} socket={socket} user={user} currRound={currentRound} roundList={roundList} mtp={mtp} />;

      case EActionProcess.CHECKIN:
        return <CheckInBox currRoom={currentRoom} otp={otp} />;

      case EActionProcess.LINEUP:
        return <LineupBox otp={otp} />;

      default:
        return null;
    }
  }, [currRoundNets, currentRoom, currentRound, match.extendedOvertime, match.tieBreaking, mtp, myTeamE, otp, roundList, socket, teamATotalScore, teamBTotalScore, user]);
  useEffect(() => {
    if (ETeam.teamA === myTeamE) {
      if (currentRound?.teamAProcess) setMtp(currentRound.teamAProcess);
      if (currentRound?.teamBProcess) setOtp(currentRound.teamBProcess);
    } else {
      if (currentRound?.teamBProcess) setMtp(currentRound.teamBProcess);
      if (currentRound?.teamAProcess) setOtp(currentRound.teamAProcess);
    }
  }, [currentRound, user, teamA, myTeamE]);

  return (
    <div className="w-full">
      <div className="mx-auto text-center">
        <div className="box w-full flex flex-col justify-center items-center">{currentRoom && renderActionBoxes()}</div>
      </div>
    </div>
  );
}

export default RoundRunner;
