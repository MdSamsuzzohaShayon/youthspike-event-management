import { useAppSelector } from '@/redux/hooks';
import { IRoom, IUserContext } from '@/types';
import { EActionProcess } from '@/types/elements';
import React from 'react'
import { Socket } from 'socket.io-client';

interface IBoxProps {
  currRoom: IRoom | null;
  user: null | IUserContext;
  socket: Socket | null;
}

function LineupBox({ currRoom, user, socket }: IBoxProps) {
  const { currentRoundNets: updateNets } = useAppSelector((state) => state.nets);
  const lineUpToUpdatePoints = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const netPointsList = [];
    for (const n of updateNets) {
      const nObj = {
        _id: n._id,
        teamAScore: n.teamAScore ? n.teamAScore : 0,
        teamBScore: n.teamBScore ? n.teamBScore : 0,
      };
      netPointsList.push(nObj);
    }
    if (socket) socket.emit("update-points-from-client", { nets: netPointsList, room: currRoom?._id, round: currRoom?._id });
  }
  return (
    <div>
      {currRoom?.teamAProcess === EActionProcess.LINEUP && currRoom.teamBProcess === EActionProcess.LINEUP ? <div>
        <p>Both team have submitted their lineup, now this round is locked, no one change their players in the net!</p>
        <button className="btn-primary" type='button' onClick={lineUpToUpdatePoints}>Update Points</button>
      </div> : <p>You have submitted your lineup successfully, now the other team need to submit their lineup!</p>}
    </div>
  )
}

export default LineupBox