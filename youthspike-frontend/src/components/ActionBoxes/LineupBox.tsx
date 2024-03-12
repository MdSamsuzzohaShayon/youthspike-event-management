import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { IRoom, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { canGoNextOrPrevRound, changeTheRound, lineupToUpdatePoints, updateMultiplePoints } from '@/utils/match/emitSocketEvents';
import React, { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client';
import PointText from './PointText';

interface IBoxProps {
  currRoom: IRoom | null;
  socket: Socket | null;
  otp: EActionProcess;
}

function LineupBox({ currRoom, socket, otp }: IBoxProps) {

  // ===== Hooks =====
  const dispatch = useAppDispatch();

  // ===== Local State =====
  const [pTxt, setPTxt] = useState<string>('');
  const [bgBox, setBgBox] = useState<string>("box-danger");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  const { myTeamE, } = useAppSelector((state) => state.matches)
  const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { current: currentRound, roundList, } = useAppSelector((state) => state.rounds);

  const handleChangeRound = async (e: React.SyntheticEvent, next: boolean) => {
    e.preventDefault();
    /**
     * Before completing current round someone can not go to the next round
     * Round must have team a score and team b score to proceed
     * Change current round nets
     */
    const newRoundIndex = canGoNextOrPrevRound({ currRound: currentRound, roundList, next, currRoundNets, dispatch });
    if (newRoundIndex !== -1) {
      changeTheRound({ socket, roundList, dispatch, allNets, currRoom, newRoundIndex, myTeamE, currRound: currentRound });
    }
  }

  const handleUpdatePoints = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Update round and nets
    updateMultiplePoints({ allNets, socket, currRoom, currRound: currentRound, currRoundNets, dispatch });
  }


  useEffect(() => {
    let pt = '';
    let bb = "box-danger";
    if (otp === EActionProcess.LINEUP) {
      pt = `Round ${currentRound?.num} - Game Play`;
      bb = "box-success";
    } else {
      pt = `Round ${currentRound?.num} - Player Assignments`;
      setIsWaiting(true);
      bb = "box-danger";
    }
    setPTxt(pt);
    setBgBox(bb);
  }, [otp, currentRound]);

  return (
    <div className={`flex py-2 w-full justify-between items-center gap-1 ${bgBox}`}>
      <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
        <PointText txt={pTxt} />
        {otp === EActionProcess.LINEUP
          ? (<React.Fragment>
            <h2 className="font-black text-start">Time to go PLAY. Once the games are finished, input the scores to complete round.</h2>
            <button className="btn-light" type='button' onClick={handleUpdatePoints}>Update Scores</button>
            {/* {currentRound?.teamAScore && currentRound.teamBScore && (<button className="btn-light" type='button' onClick={(e) => handleChangeRound(e, true)}>Next Round</button>)} */}
          </React.Fragment>)
          : <React.Fragment>
            <h2 className="font-black text-start">Waiting for the other squad to MATCH their lineup.</h2>
            <button className={`btn-light-outline`} type='button' >YOU PLACED YOUR LINEUP</button>
          </React.Fragment>}
      </div>
      <div className="hidden md:block w-2/6">
        <img src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  )
}

export default LineupBox;