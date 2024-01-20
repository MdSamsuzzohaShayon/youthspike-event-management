/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setNetsByRoundId, setCurrNetNum, setCurrentRoundNets } from '@/redux/slices/netSlice';

// Utils
import { screen } from '@/utils/constant';

// Components
import LogoMatchScore from './LogoMatchScore';
import PointsByRound from './PointsByRound';
import NetCard from './NetCard';
import { ITeam } from '@/types';
import { useUser } from '@/lib/UserProvider';
import { setCurrentRound } from '@/redux/slices/roundSlice';
import { useSocket } from '@/lib/SocketProvider';


function NetScoreOfRound({ currRoundId }: { currRoundId: string }) {
  /**
   * Display specific selected net in mobile screen
   * Display multiple nets with slider
   */

  const socket = useSocket();
  // Redux
  const dispatch = useAppDispatch();

  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { currNetNum, currentRoundNets, nets } = useAppSelector((state) => state.nets);
  const { roundList, current: currentRound } = useAppSelector((state) => state.rounds);
  const { myTeam, opTeam } = useAppSelector((state) => state.matches);
  const currentRoom = useAppSelector((state) => state.rooms.current);

  // Local State
  const dialogSettingEl = useRef<HTMLDialogElement | null>(null);

  // Handle events
  const handleSettingOpen = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!dialogSettingEl.current) return;
    dialogSettingEl.current.showModal();
  };
  const handleSettingClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!dialogSettingEl.current) return;
    dialogSettingEl.current.close();
  };

  const handleRoundChange = (e: React.SyntheticEvent, roundId: string) => {
    e.preventDefault();
    // Make a dispatch to change current round, current round num and more related to this
    const findNextRound = roundList.find((r) => r._id === roundId);
    if (findNextRound?.num && currentRound?.num && currentRound?.num < findNextRound?.num) {
      // Must have score for current round for both teams
      if (!currentRound.teamAScore || !currentRound.teamBScore || currentRound.teamAScore === 0 || currentRound.teamBScore === 0) return;
      let validChange = true;

      // Check points in all nets
      let i = 0;
      while (i < currentRoundNets.length) {
        if (!currentRoundNets[i].teamAScore || !currentRoundNets[i].teamBScore) {
          validChange = false;
        }
        i += 1;
      }

      if (!validChange) return;


      const rcd = { room: currentRoom?._id, round: currentRound._id, nextRound: findNextRound._id }; // round change data is rcd
      // @ts-ignore
      if (socket) socket.emit("round-change-from-client", rcd);
    }
    if (findNextRound) {
      dispatch(setCurrentRound(findNextRound));
      const findNets = nets.filter((n) => n.round === findNextRound._id);
      dispatch(setCurrentRoundNets(findNets))
    }
  }


  useEffect(() => {
    if (currentRoundNets && currentRoundNets.length > 0) {
      dispatch(setCurrNetNum(currentRoundNets[0].num));
    }
  }, []);

  return (
    <div className="net-score container px-4 mx-auto flex justify-between gap-1 text relative mt-4">
      {/* Left side round detail start  */}
      <div className="round-detail w-3/6" style={{ height: '30rem' }}>
        <div className="round-top h-3/6 w-full bg-gray-900 text-gray-100 px-2 flex flex-col items-center justify-around">
          <LogoMatchScore dark team={opTeam} />

          <div className="round-nums mt-4 flex w-full justify-start gap-1 items-center">
            {roundList.map((round) => (
              <button className={`single-r w-8 ${round._id === currentRound?._id ? "bg-yellow-500 text-gray-100" : "bg-gray-100 text-gray-900"} py-1 text-center cursor-pointer`} type="button" onClick={(e) => handleRoundChange(e, round._id)} key={round._id}>
                RD{round.num}
              </button>
            ))}
          </div>
          <PointsByRound roundList={roundList} dark />
        </div>
        <div className="round-bottom h-3/6 w-full border border-gray-900 px-2 flex flex-col items-center justify-around">
          <PointsByRound roundList={roundList} dark={false} />
          <LogoMatchScore dark={false} team={myTeam} />
        </div>
      </div>
      {/* Left side round detail end  */}

      {/* Setting start  */}
      <dialog ref={dialogSettingEl} className="w-5/6 py-2 h-96" style={{ left: '8.5%', top: '25%', border: 'none' }}>
        <h3>Setting</h3>
        <div className="w-8 h-8" onClick={handleSettingClose} role="presentation">
          <img src="/icons/close.svg" alt="cross" className="w-full" />
        </div>
      </dialog>
      <div className="img-holder p-2 w-8 absolute left-1 border-3 bg-gray-100 rounded-full cursor-pointer" style={{ top: '47%' }} role="presentation" onClick={handleSettingOpen} onKeyDown={(e) => { }}>
        <img src="/icons/setting.svg" alt="setting" className="w-full" />
      </div>
      {/* Setting end  */}

      {/* Right side net detail start */}
      {screenWidth > screen.xs ? currentRoundNets.map((net) => <NetCard key={net._id} net={net} />) : <NetCard net={currentRoundNets.find((n) => n.num === currNetNum && n.round === currRoundId)} />}
      {/* Right side net detail end */}
    </div>
  );
}

export default NetScoreOfRound;