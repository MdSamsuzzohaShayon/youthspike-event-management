/* eslint-disable no-nested-ternary */
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import Image from 'next/image';
import { IRoom } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import React, { useEffect, useState } from 'react';
import { setVerifyLineup, setclosePSCAvailable } from '@/redux/slices/matchesSlice';
import { setActErr } from '@/redux/slices/elementSlice';
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
  const { myTeamE, myPlayers, closePSCAvailable } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);

  const handleCheckInToLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!currRoom) return;
    // ===== Make sure all entes are filled with players =====
    let filled = true;
    const selectedPlayerIds = [];
    for (let i = 0; i < currentRoundNets.length; i += 1) {
      if (myTeamE === ETeam.teamA) {
        if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) {
          filled = false;
        } else {
          selectedPlayerIds.push(currentRoundNets[i].teamAPlayerA, currentRoundNets[i].teamAPlayerB);
        }
      } else if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) {
        filled = false;
      } else {
        selectedPlayerIds.push(currentRoundNets[i].teamBPlayerA, currentRoundNets[i].teamBPlayerB);
      }
    }

    // ===== Make sure did use previous subbed players =====
    if (currRound?.num && currRound?.num > 1 && filled) {
      const prevRound = roundList.find((r) => r.num === currRound.num - 1);
      const dupSubPlayers = [];
      if (prevRound) {
        const subPlayers = new Set();
        const myPlayerIds = myPlayers.map((p) => p._id);
        for (let i = 0; i < prevRound.subs.length; i += 1) {
          if (myPlayerIds.includes(prevRound.subs[i])) subPlayers.add(prevRound.subs[i]);
        }
        if (subPlayers.size > 0) {
          // @ts-ignore
          const subPlayersList = [...subPlayers];
          // all subbed players must be inside selected player ids
          for (let j = 0; j < subPlayersList.length; j += 1) {
            if (!selectedPlayerIds.includes(subPlayersList[j])) dupSubPlayers.push(subPlayersList[j]);
          }
        }
      }
      if (dupSubPlayers.length > 0) {
        // Show error
        let errMsg = '';
        dupSubPlayers.forEach((up) => {
          const findPlayer = myPlayers.find((p) => p._id === up);
          if (findPlayer) {
            errMsg += `${findPlayer.firstName}, `;
          }
        });

        errMsg += `${dupSubPlayers.length > 1 ? 'were' : 'was'} subbed previous round, they must be selected in this round`;

        dispatch(setActErr({ name: 'Unselected Previous Subbed Player', main: errMsg, message: errMsg }));
        return;
      }
    }

    if (closePSCAvailable) dispatch(setclosePSCAvailable(false));
    if (filled) dispatch(setVerifyLineup(true));
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
            <button className={`${fillNet ? 'btn-light-outline' : 'btn-light'}`} type="button" onClick={handleCheckInToLineup}>
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
            <button className={`${fillNet ? 'btn-light-outline' : 'btn-light'}`} type="button" onClick={handleCheckInToLineup}>
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
