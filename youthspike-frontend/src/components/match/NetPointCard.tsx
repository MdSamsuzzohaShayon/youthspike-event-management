import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { INetRelatives, IRoundRelatives } from '@/types';
import { IRoom } from '@/types/room';
import { ETeam } from '@/types/team';
import { fsToggle } from '@/utils/helper';
import React, { useEffect, useState } from 'react';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { lineupToUpdatePoints } from '@/utils/match/emitSocketEvents';
import { useSocket } from '@/lib/SocketProvider';
import { ETieBreaker } from '@/types/net';
import Image from 'next/image';
import { screen } from '@/utils/constant';
import TeamScoreInput from '../team/TeamScoreInput';

interface INetPointCardProps {
  net: INetRelatives | null | undefined;
  handleRightShift: () => void;
  handleLeftShift: () => void;
  screenWidth: number;
  currRoom: IRoom | null;
  roundList: IRoundRelatives[];
}

function NetPointCard({ net, handleRightShift, handleLeftShift, screenWidth, currRoom, roundList }: INetPointCardProps) {
  const user = useUser();
  const dispatch = useAppDispatch();
  const socket = useSocket();

  const [wTeam, setWTeam] = useState<ETeam | null>(null);

  const { current: currRound } = useAppSelector((state) => state.rounds);
  const { nets: allNets, currentRoundNets: currRoundNets } = useAppSelector((state) => state.nets);
  const teamA = useAppSelector((state) => state.teams.teamA);

  const handlePointChange = (e: React.SyntheticEvent, netId: string | null, teamAorB: string) => {
    /**
     * Set team a score and team b score for specific net
     */
    e.preventDefault();
    if (!netId) return;

    const inputEl = e.target as HTMLInputElement;
    if (!inputEl.value || inputEl.value === '') return;
    const teamScore = parseInt(inputEl.value, 10);
    const updateObj: { teamAScore: null | number; teamBScore: null | number } = { teamAScore: null, teamBScore: null };
    if (teamAorB === ETeam.teamA) {
      updateObj.teamAScore = teamScore;
      updateObj.teamBScore = net?.teamBScore ? net?.teamBScore : null;
    } else {
      updateObj.teamBScore = teamScore;
      updateObj.teamAScore = net?.teamAScore ? net?.teamAScore : null;
    }

    // Set current round nets and all nets
    const updatedCRN = [...currRoundNets]; // crn = current round nets
    const updatedAllNets = [...allNets];
    const findCRN = updatedCRN.findIndex((n) => n._id === netId);
    if (findCRN !== -1) updatedCRN[findCRN] = { ...updatedCRN[findCRN], ...updateObj };
    const findAN = updatedAllNets.findIndex((n) => n._id === netId);
    if (findAN !== -1) updatedAllNets[findAN] = { ...updatedAllNets[findAN], ...updateObj };
    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedAllNets));

    // Update current round
    let tas: number | null = null;
    let tbs: number | null = null;
    updatedCRN.forEach((n) => {
      if (n.teamAScore && n.teamBScore) {
        tas = tas ? tas + n.teamAScore : n.teamAScore;
        tbs = tbs ? tbs + n.teamBScore : n.teamBScore;
      } else {
        tas = null;
        tbs = null;
      }
    });

    const currRoundObj = { ...currRound, teamAScore: tas, teamBScore: tbs, completed: !!(tas && tbs) } as IRoundRelatives;
    dispatch(setCurrentRound(currRoundObj));
    const updatedRoundList = [...roundList];
    const rI = updatedRoundList.findIndex((r) => r._id === currRound?._id);
    if (rI === -1) return;
    updatedRoundList[rI] = { ...currRoundObj };
    dispatch(setRoundList(updatedRoundList));

    // Update to the server
    lineupToUpdatePoints({ socket, currRoom, currRound: currRoundObj, currRoundNets: updatedCRN });
  };

  const handleKeyUp = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const TBS = net?.teamBScore?.toString() || '';
    const TAS = net?.teamAScore?.toString() || '';
    if (TAS && TAS !== '' && TBS && TBS !== '') {
      if (parseInt(TAS, 10) > parseInt(TBS, 10)) {
        setWTeam(ETeam.teamA);
      } else if (parseInt(TAS, 10) < parseInt(TBS, 10)) {
        setWTeam(ETeam.teamB);
      } else {
        setWTeam(null);
      }
    } else {
      setWTeam(null);
    }
  }, [net]);

  const teamACapOrCo = user.info?.captainplayer === teamA?.captain?._id || user.info?.cocaptainplayer === teamA?.cocaptain?._id;

  return (
    <div className="absolute z-10 w-11/12 left-2 bg-yellow-400 flex flex-col justify-around items-center p-1 rounded-lg top-1/2 transform -translate-y-1/2">
      <TeamScoreInput
        key={`${1}-${net?._id}`}
        currRound={currRound}
        net={net ?? null}
        user={user}
        teamName={`${user && teamACapOrCo ? 'teamBScore' : 'teamAScore'}`}
        screenWidth={screenWidth}
        handlePointChange={handlePointChange}
        teamE={user && teamACapOrCo ? ETeam.teamB : ETeam.teamA}
        wTeam={wTeam}
      />
      <div className="net-card flex justify-around items-center w-full py-1">
        {screenWidth <= screen.xs && (
          <Image
            width={50}
            height={30}
            src="/icons/right-arrow.svg"
            alt="right-arrow"
            onKeyUp={handleKeyUp}
            onClick={handleRightShift}
            role="presentation"
            className="w-4 svg-white transform scale-x-[-1]"
          />
        )}
        <div className="texts text-center">
          <h3 style={fsToggle(screenWidth)} className="leading-3 uppercase">
            Net {net?.num}
          </h3>
          {net?.netType === ETieBreaker.TIE_BREAKER_NET && <p className="w-full">Worth 2 points</p>}
        </div>
        {screenWidth <= screen.xs && (
          <Image width={50} height={30} src="/icons/right-arrow.svg" alt="left-arrow" onKeyUp={handleKeyUp} onClick={handleLeftShift} role="presentation" className="w-4 svg-white" />
        )}
      </div>
      <TeamScoreInput
        key={`${3}-${net?._id}`}
        currRound={currRound}
        net={net ?? null}
        user={user}
        teamName={`${user && teamACapOrCo ? 'teamAScore' : 'teamBScore'}`}
        screenWidth={screenWidth}
        handlePointChange={handlePointChange}
        teamE={user && teamACapOrCo ? ETeam.teamA : ETeam.teamB}
        wTeam={wTeam}
      />
    </div>
  );
}

export default NetPointCard;
