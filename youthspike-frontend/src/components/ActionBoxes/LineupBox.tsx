import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IRoom, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { canGoNextOrPrevRound, changeTheRound } from '@/utils/match/roundChange';
import React, { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client';

interface IBoxProps {
  currRoom: IRoom | null;
  user: null | IUserContext;
  socket: Socket | null;
  otp: EActionProcess;
  mtp: EActionProcess;
}

function LineupBox({ currRoom, user, socket, otp, mtp }: IBoxProps) {
  const dispatch = useAppDispatch();
  const [opProcessForMyRound, setOpProcessForMyRound] = useState<EActionProcess>(EActionProcess.CHECKIN); // Oponent process for my current round

  const { myTeamE, } = useAppSelector((state) => state.matches)
  const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { current: currentRound, roundList, } = useAppSelector((state) => state.rounds);

  const lineUpToUpdatePoints = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const netPointsList = [];
    for (const n of currRoundNets) {
      const nObj = {
        _id: n._id,
        teamAScore: n.teamAScore ? n.teamAScore : 0,
        teamBScore: n.teamBScore ? n.teamBScore : 0,
      };
      netPointsList.push(nObj);
    }
    if (socket) socket.emit("update-points-from-client", { nets: netPointsList, room: currRoom?._id, round: currentRound?._id });
  }

  const handleChangeRound = async (e: React.SyntheticEvent, next: boolean) => {
    e.preventDefault();
    /**
     * Before completing current round someone can not go to the next round
     * Round must have team a score and team b score to proceed
     * Change current round nets
     */
    const newRoundIndex = canGoNextOrPrevRound({ currRound: currentRound, roundList, next, currRoundNets });
    if (newRoundIndex !== -1) {
      changeTheRound({ socket, roundList, dispatch, allNets, currRoom, newRoundIndex, myTeamE, currRound: currentRound });
    }
  }

  useEffect(() => {
    // Set oponent team process for Specific round
    if (currentRound) {
      if (myTeamE === ETeam.teamA) {
        if (currentRound.teamAProcess) setOpProcessForMyRound(currentRound.teamAProcess);
      } else {
        if (currentRound.teamBProcess) setOpProcessForMyRound(currentRound.teamBProcess);
      }
    }
  }, [currentRound]);

  return (
    <div>
      {otp === EActionProcess.LINEUP ? <div>
        <p>Both team have submitted their lineup, now this round is locked, no one change their players in the net!</p>
        <div className="buttons flex w-full justify-center items-center gap-x-2">
          <button className="btn-primary" type='button' onClick={lineUpToUpdatePoints}>Update Points</button>
          {currentRound?.teamAScore && currentRound.teamBScore && (<button className="btn-primary" type='button' onClick={(e) => handleChangeRound(e, true)}>Next Round</button>)}

        </div>
      </div> : <p>You have submitted your lineup successfully, now the other team need to submit their lineup!</p>}
    </div>
  )
}

export default LineupBox