import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setTeamProcess } from '@/redux/slices/matchesSlice';
import { setCurrentRoundNets } from '@/redux/slices/netSlice';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrentRound } from '@/redux/slices/roundSlice';
import { IRoom, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import React from 'react'
import { Socket } from 'socket.io-client';

interface IBoxProps {
  currRoom: IRoom | null;
  socket: Socket | null;
  user: null | IUserContext;
}

function RoundChangeBox({ currRoom, socket, user }: IBoxProps) {

  const dispatch = useAppDispatch();

  const { teamA } = useAppSelector((state) => state.teams);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { nets: allNets } = useAppSelector((state) => state.nets);
  const { opTeamProcess } = useAppSelector((state) => state.matches);

  const teamARequested = () => {
    let requested = false;
    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    if (isTeamACaptain) {
      if (currRoom?.round === currentRound?._id) {
        requested = true;
      }
    }else{
      if (currRoom?.round === currentRound?._id) {
        requested = true;
      }
    }

    return requested;
  }


  const handleRoundChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!currRoom) return;

    const currRoomObj = { ...currRoom, teamAProcess: EActionProcess.CHECKIN, teamBProcess: EActionProcess.CHECKIN };
    let currRoundId: null | string = null;
    if (teamARequested()) {
      currRoomObj.teamBRound = currRoomObj.teamARound;
      currRoundId = currRoomObj.round;
      if(currRoom.teamAProcess)currRoomObj.teamAProcess = currRoom.teamAProcess;
    } else {
      currRoomObj.teamARound = currRoomObj.teamBRound;
      currRoundId = currRoomObj.round;
      if(currRoom.teamBProcess)currRoomObj.teamBProcess = currRoom.teamBProcess;
    }

    if (!currRoundId) return;
    const targetRound = roundList.find((r) => r._id === currRoundId);
    if (!targetRound) return;
    const roundObj = { ...targetRound, teamAProcess: currRoomObj.teamAProcess, teamBProcess: currRoomObj.teamBProcess }
    dispatch(setCurrentRound(roundObj));
    dispatch(setCurrentRoom(currRoomObj));
    const crn = allNets.filter((n) => n.round === roundObj._id); // crn = current round nets
    dispatch(setCurrentRoundNets(crn));
    dispatch(setTeamProcess({ myTeamProcess: EActionProcess.CHECKIN, opTeamProcess }));

    // @ts-ignore
    socket.emit('round-change-accept-from-client', currRoomObj);

  }


  return (
    <div>
      {teamARequested() ? <p>You have requested to go to a new round, the oponent should respond to join the round</p> : <div>
        <p>Your oponent has requested to change the round, do you agree to continue the match?</p>
        <button className="btn-primary" type='button' onClick={handleRoundChange} >Change Round</button>
      </div>}
    </div>
  )
}

export default RoundChangeBox