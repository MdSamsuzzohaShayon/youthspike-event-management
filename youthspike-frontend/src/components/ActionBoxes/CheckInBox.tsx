/* eslint-disable no-nested-ternary */
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import Image from 'next/image';
import { IRoom } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import submitLineup from '@/utils/match/submitLineup';
import React, { useEffect, useState } from 'react';
import PointText from './PointText';

interface IBoxProps {
  currRoom: IRoom | null;
  otp: EActionProcess;
}

function CheckInBox({ currRoom, otp }: IBoxProps) {
  // ===== Hooks =====
  const dispatch = useAppDispatch();

  // ===== Local State =====
  const [fillNet, setFillNet] = useState<boolean>(false);
  const [pTxt, setPTxt] = useState<string>('');
  const [bgBox, setBgBox] = useState<string>('box-danger');

  // ===== Redux State =====
  const { myTeamE, myPlayers, closePSCAvailable, match: currMatch } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);

  const handleSubmitLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    submitLineup({ dispatch, currMatch, currRoom, myTeamE, currentRoundNets, currRound, myPlayers, roundList, closePSCAvailable });
  };

  useEffect(() => {
    let filled = true;
    for (let i = 0; i < currentRoundNets.length; i += 1) {
      if (myTeamE === ETeam.teamA) {
        if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) filled = false;
      } else if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) filled = false;
    }
    setFillNet(filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoundNets]);

  useEffect(() => {
    let pt = '';
    let bb = 'box-danger';
    // You have checked in successfully, now the other team need to be checked in!
    // Set wait for another team
    // Placing first
    if (currRound?.teamAProcess === EActionProcess.CHECKIN && currRound?.teamBProcess === EActionProcess.CHECKIN) {
      pt = `Round ${currRound.num} - Player Assignments`;
      if (myTeamE === currRound?.firstPlacing) {
        bb = 'box-success';
      }
    } else if (otp === EActionProcess.LINEUP) {
      // placing second
      pt = `Round ${currRound?.num} - Player Assignments`;
      bb = 'box-success';
    } else if (currRound?.num === 1) {
      pt = 'Squad check in';
    }
    setBgBox(bb);
    setPTxt(pt);
  }, [currRound, otp, myTeamE]);

  const placingFirstElement = () => {
    return (
      <div className="flex w-full justify-start items-start flex-col">
        {myTeamE === currRound?.firstPlacing ? (
          <>
            <h2 className="font-black text-start">PLACING your lineup. Please assign 2 players to each net and SUBMIT your lineup. </h2>
            <button className={`${fillNet ? 'btn-light-outline' : 'btn-light'}`} type="button" onClick={handleSubmitLineup}>
              Submit Lineup
            </button>
          </>
        ) : (
          <h2 className="font-black text-start">Waiting for the other squad to PLACE their lineup.</h2>
        )}
      </div>
    );
  };

  return (
    <div className={`flex py-2 w-full justify-between items-center gap-1 ${bgBox}`}>
      <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
        <PointText txt={pTxt} />
        {currRound?.teamAProcess === EActionProcess.CHECKIN && currRound?.teamBProcess === EActionProcess.CHECKIN ? (
          placingFirstElement()
        ) : otp === EActionProcess.LINEUP ? (
          <>
            <h2 className="font-black text-start">MATCHING your lineup. Please assign 2 players to each net and SUBMIT your lineup. </h2>
            <button className={`${fillNet ? 'btn-light-outline' : 'btn-light'}`} type="button" onClick={handleSubmitLineup}>
              Submit Lineup
            </button>
          </>
        ) : currRound?.num === 1 ? (
          <>
            <h2 className="uppercase font-black text-start">Waiting for the other squad to check in.</h2>
            <button type="button" className="btn-success">
              You are checked in
            </button>
          </>
        ) : (
          placingFirstElement()
        )}
      </div>
      <div className="hidden md:block w-2/6">
        <Image width={300} height={200} src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  );
}

export default CheckInBox;
