import { useSocket } from '@/lib/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setTeamProcess } from '@/redux/slices/matchesSlice';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { IRoom, IUserContext } from '@/types';
import { EActionProcess, INetAssign } from '@/types/room';
import { ETeam } from '@/types/team';
import React from 'react'
import { Socket } from 'socket.io-client';

interface IBoxProps {
  currRoom: IRoom | null;
  user: null | IUserContext;
  socket: null | Socket;
}

function CheckInBox({ currRoom, user, socket }: IBoxProps) {

  const dispatch = useAppDispatch();

  const { teamA } = useAppSelector((state) => state.teams);
  const { myTeamE, opTeamProcess } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound } = useAppSelector((state)=> state.rounds);


  const checkInToLineup = (e: React.SyntheticEvent) => {
    if (!currRoom) return;
    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    const actionData: any = {
      room: currRoom._id,
      round: currRoom.round,
      teamAProcess: currRoom.teamAProcess,
      teamBProcess: currRoom.teamBProcess,
      nets: []
    };
    if (isTeamACaptain) {
      actionData.teamAProcess = EActionProcess.LINEUP
    } else {
      actionData.teamBProcess = EActionProcess.LINEUP
    }

    const roundNetAssign: INetAssign[] = currentRoundNets.map((net) => ({
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA,
      teamAPlayerB: net.teamAPlayerB,
      teamBPlayerA: net.teamBPlayerA,
      teamBPlayerB: net.teamBPlayerB,
    }));
    actionData.nets = roundNetAssign;

    // @ts-ignore
    const currRoomObj = { ...currRoom, teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess }

    dispatch(setCurrentRoom(currRoomObj));
    dispatch(setTeamProcess({ myTeamProcess: EActionProcess.LINEUP, opTeamProcess }));

    // @ts-ignore
    socket.emit('submit-lineup-from-client', actionData);
  }
  return (
    <div>
      {currRoom?.teamAProcess === EActionProcess.CHECKIN && currRoom.teamBProcess === EActionProcess.CHECKIN
        ? (<div>
          {myTeamE === currRound?.firstPlacing ? <React.Fragment>
            <p>You are placing first, Select 2 players for each net and submit line up!</p>
            <button className="btn-primary" type='button' onClick={checkInToLineup} >Submit Lineup</button>
          </React.Fragment> : <p>Wait for another team to submit their lineup, you are going to match up with their line up!</p>}
        </div>)
        : (opTeamProcess === EActionProcess.LINEUP ? <div>
          <p>The Other team have submitted their lineup now, it's your turn</p>
          <button className="btn-primary" type='button' onClick={checkInToLineup} >Submit Lineup</button>
        </div> : <p>You have checked in successfully, now the other team need to be checked in!</p>)}
    </div>
  )
}

export default CheckInBox