/* eslint-disable no-nested-ternary */
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import Image from 'next/image';
import { IRoom, IRoundRelatives } from '@/types';
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

  const handleSubmitLineup = (e: React.SyntheticEvent) => {
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

    /**
     * Make sure did use previous subbed players
     * A player can be subbed only once in a match, exception below
     * A player is only allowd to sub when all other player had been subbed for atleast once
     */
    if (currRound?.num && currRound?.num > 1 && filled) {
      const myPlayerIds = myPlayers.map((p) => p._id);
      const preSubbedPlayerIds: Set<string> = new Set<string>();
      const subbedPlayerIds: Set<string> = new Set<string>();
      roundList.forEach((rl: IRoundRelatives) => {
        // @ts-ignore
        if (rl.subs && rl.subs.length > 0) {
          rl.subs.forEach((rls) => {
            if (rls) preSubbedPlayerIds.add(rls); // This line will produce an error
          });
        }
      });

      // Subbed players of this round
      for (let j = 0; j < myPlayerIds.length; j += 1) {
        if (!selectedPlayerIds.includes(myPlayerIds[j])) subbedPlayerIds.add(myPlayerIds[j]);
      }

      // All player has not been subbed atleast for once
      if (subbedPlayerIds.size < myPlayerIds.length) {
        //   // Show error
        let errMsg = '';
        let dupPlayerCount = 0;
        subbedPlayerIds.forEach((up) => {
          if (preSubbedPlayerIds.has(up)) {
            const findPlayer = myPlayers.find((p) => p._id === up);
            if (findPlayer) {
              errMsg += `${findPlayer.firstName}, `;
              dupPlayerCount += 1;
            }
          }
        });
        if (dupPlayerCount > 0) {
          errMsg += `${dupPlayerCount > 1 ? 'were' : 'was'} subbed previously, ${dupPlayerCount > 1 ? 'they' : 'he'} must be selected in this round`;
          dispatch(setActErr({ success: false, message: errMsg }));
          return;
        }
      }
    }

    if (closePSCAvailable) dispatch(setclosePSCAvailable(false));
    if (filled) {
      dispatch(setActErr(null));
      dispatch(setVerifyLineup(true));
    }
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
