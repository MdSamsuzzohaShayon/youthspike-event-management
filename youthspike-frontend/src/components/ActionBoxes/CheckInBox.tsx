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
import PointText from './PointText';

interface IBoxProps {
  currRoom: IRoom | null;
  user: null | IUserContext;
  roundList: IRoundRelatives[];
  otp: EActionProcess;
  mtp: EActionProcess;
  socket: Socket | null;
}

function CheckInBox({ currRoom, user, roundList, mtp, otp, socket }: IBoxProps) {

  // ===== Hooks =====
  const dispatch = useAppDispatch();

  // ===== Local State =====
  const [fillNet, setFillNet] = useState<boolean>(false);
  const [checkedIn, setCheckedIn] = useState<boolean>(false);
  const [placingFirst, setPlacingFirst] = useState<boolean>(false);
  const [opSubmitted, setOpSubmitted] = useState<boolean>(false);
  const [pTxt, setPTxt] = useState<string>('');

  // ===== Redux State =====
  const { teamA } = useAppSelector((state) => state.teams);
  const { myTeamE, verifyLineup } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound } = useAppSelector((state) => state.rounds);


  const handleCheckInToLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!currRoom) return;
    // ===== Make sure all entes are filled with players =====
    let filled = true;
    for (let i = 0; i < currentRoundNets.length; i++) {
      if (myTeamE === ETeam.teamA) {
        if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) filled = false;
      } else {
        if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) filled = false;
      }
    }

    if (filled) dispatch(setVerifyLineup(true));
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

  useEffect(() => {
    let pt = "";
    // You have checked in successfully, now the other team need to be checked in!
    // Set wait for another team
    // Placing first
    if (currRound?.teamAProcess === EActionProcess.CHECKIN && currRound?.teamBProcess === EActionProcess.CHECKIN) {
      pt = `Round ${currRound.num} - Player Assignments`;
      if (myTeamE === currRound?.firstPlacing) {
        setPlacingFirst(true);
      }
    } else {
      // placing second
      if (otp === EActionProcess.LINEUP) {
        pt = `Round ${currRound?.num} - Player Assignments`;
        setOpSubmitted(true);        
      } else {
        if (currRound?.num === 1) {
          setCheckedIn(true);
          pt = "Squad check in";
        }
      }
    }
    setPTxt(pt);
  }, [currRound, otp, myTeamE]);

  const placingFirstElement = () => {
    return (<div className='flex w-full justify-start items-start flex-col'>
      {myTeamE === currRound?.firstPlacing ? (<React.Fragment>
        <h2 className="font-black text-start">PLACING your lineup. Please assign 2 players to each net and SUBMIT your lineup. </h2>
        <button className={`${fillNet ? "btn-light-outline" : "btn-light"}`} type='button' onClick={handleCheckInToLineup} >Submit Lineup</button>
      </React.Fragment>) : (<React.Fragment><h2 className="font-black text-start">Waiting for the other squad to PLACE their lineup.</h2>
      </React.Fragment>)}
    </div>);
  }

  return (
    <div className={`flex py-2 w-full justify-between items-center gap-1 ${checkedIn && !placingFirst && !opSubmitted? "box-danger" : "box-success"}`}>
      <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
        <PointText txt={pTxt} />
        {currRound?.teamAProcess === EActionProcess.CHECKIN && currRound?.teamBProcess === EActionProcess.CHECKIN
          ? placingFirstElement()
          : (otp === EActionProcess.LINEUP ? <React.Fragment>
            <h2 className="font-black text-start" >MATCHING your lineup. Please assign 2 players to each net and SUBMIT your lineup. </h2>
            <button className={`${fillNet ? "btn-light-outline" : "btn-light"}`} type='button' onClick={handleCheckInToLineup} >Submit Lineup</button>
          </React.Fragment> : (currRound?.num === 1
            ? <React.Fragment><h2 className="uppercase font-black text-start">Waiting for the other squad to check in.</h2><button type='button' className='btn-light' >You are checked in</button></React.Fragment>
            : placingFirstElement()))}
      </div>
      <div className="hidden md:block w-2/6">
        <img src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  )
}

export default CheckInBox;