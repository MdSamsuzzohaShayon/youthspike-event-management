import { useSocket } from '@/lib/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IRoom, IRoundRelatives, IUserContext } from '@/types';
import { EActionProcess, INetAssign } from '@/types/room';
import { ETeam } from '@/types/team';
import React from 'react'
import { Socket } from 'socket.io-client';

interface IBoxProps {
  currRoom: IRoom | null;
  user: null | IUserContext;
  socket: null | Socket;
  roundList: IRoundRelatives[];
  otp: EActionProcess;
  mtp: EActionProcess;
}

function CheckInBox({ currRoom, user, socket, roundList, mtp, otp}: IBoxProps) {

  const dispatch = useAppDispatch();

  const { teamA } = useAppSelector((state) => state.teams);
  const { myTeamE } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound } = useAppSelector((state)=> state.rounds);


  const checkInToLineup = (e: React.SyntheticEvent) => {
    if (!currRoom) return;
    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    const actionData: any = {
      room: currRoom._id,
      round: currRound?._id,
      teamAProcess: currRound?.teamAProcess,
      teamBProcess: currRound?.teamBProcess,
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

    // Reset current round, and round list
    const cri = roundList.findIndex((r)=> r._id === currRound?._id) // vri = current round index
    if(cri === -1) return;
    const roundObj = {...roundList[cri], teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess};
    dispatch(setRoundList([...roundList.filter((r)=> r._id !== currRound?._id), roundObj]));
    dispatch(setCurrentRound(roundObj));

    // @ts-ignore
    socket.emit('submit-lineup-from-client', actionData);
  }
  return (
    <div>
      {currRound?.teamAProcess === EActionProcess.CHECKIN && currRound?.teamBProcess === EActionProcess.CHECKIN
        ? (<div>
          {myTeamE === currRound?.firstPlacing ? <React.Fragment>
            <p>You are placing first, Select 2 players for each net and submit line up!</p>
            <button className="btn-primary" type='button' onClick={checkInToLineup} >Submit Lineup</button>
          </React.Fragment> : <p>Wait for another team to submit their lineup, you are going to match up with their line up!</p>}
        </div>)
        : (otp === EActionProcess.LINEUP ? <div>
          <p>The Other team have submitted their lineup now, it's your turn</p>
          <button className="btn-primary" type='button' onClick={checkInToLineup} >Submit Lineup</button>
        </div> : <p>You have checked in successfully, now the other team need to be checked in!</p>)}
    </div>
  )
}

export default CheckInBox