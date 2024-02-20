import { useSocket } from '@/lib/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IRoom, IRoundRelatives, IUserContext, IRoomNetAssign } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { checkInToLineup } from '@/utils/match/emitSocketEvents';
import React, { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client';
import VerifyLineup from './VerifyLineup';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';

interface IBoxProps {
  currRoom: IRoom | null;
  user: null | IUserContext;
  roundList: IRoundRelatives[];
  otp: EActionProcess;
  mtp: EActionProcess;
  socket: Socket | null;
}

function CheckInBox({ currRoom, user, roundList, mtp, otp, socket }: IBoxProps) {

  const dispatch = useAppDispatch();

  const [fillNet, setFillNet] = useState<boolean>(false);

  const { teamA } = useAppSelector((state) => state.teams);
  const { myTeamE, verifyLineup } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound } = useAppSelector((state) => state.rounds);


  const handleCheckInToLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!currRoom) return;
    // Make sure all entes are filled with players
    let filled = true;
    for (let i = 0; i < currentRoundNets.length; i++) {
      if (myTeamE === ETeam.teamA) {
        if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) filled = false;
      } else {
        if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) filled = false;
      }
    }

    if (filled) dispatch(setVerifyLineup(true));
    // checkInToLineup({ socket, user, teamA, currRoom, currRound, currRoundNets: currentRoundNets, roundList, dispatch, myTeamE });
  }


  useEffect(() => {
    let filled = true;
    for (let i = 0; i < currentRoundNets.length; i++) {
      if (myTeamE === ETeam.teamA) {
        if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) filled = false;
      } else {
        if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) filled = false;
      }
    }
    setFillNet(filled);
  }, [currentRoundNets]);

  const placingFirstElement = () => {
    return (<div>
      {myTeamE === currRound?.firstPlacing ? <React.Fragment>
        <p>You are placing first, Select 2 players for each net and submit line up!</p>
        <button className={fillNet ? "btn-info" : "btn-primary"} type='button' onClick={handleCheckInToLineup} >Submit Lineup</button>
      </React.Fragment> : <p>Wait for another team to submit their lineup, you are going to match up with their line up!</p>}
    </div>);
  }

  return (
    <div>
      {
        /* Temporary  */
        verifyLineup && <VerifyLineup />}

      {currRound?.teamAProcess === EActionProcess.CHECKIN && currRound?.teamBProcess === EActionProcess.CHECKIN
        ? placingFirstElement()
        : (otp === EActionProcess.LINEUP ? <div>
          <p>The Other team have submitted their lineup now, it's your turn</p>
          <button className={fillNet ? "btn-info" : "btn-primary"} type='button' onClick={handleCheckInToLineup} >Submit Lineup</button>
        </div> : (currRound?.num === 1
          ? <p>You have checked in successfully, now the other team need to be checked in!</p>
          : placingFirstElement()))}
    </div>
  )
}

export default CheckInBox