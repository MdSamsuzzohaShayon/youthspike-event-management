/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef } from 'react';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setNetsByRoundId, setCurrNetNum } from '@/redux/slices/netSlice';

// Utils
import { screen } from '@/utils/constant';

// Components
import LogoMatchScore from './LogoMatchScore';
import PointsByRound from './PointsByRound';
import NetCard from './NetCard';

// Constant variables
const currRoundId: string = '6583df73a31ed7dedcc1690b';

function NetScoreOfRound() {
  /**
   * Display specific selected net in mobile screen
   * Display multiple nets with slider
   */

  // Redux
  const dispatch = useAppDispatch();
  const allNets = useAppSelector((state) => state.nets.nets);
  const currRoundNets = useAppSelector((state) => state.nets.currentRoundNets);
  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const currNetNum = useAppSelector((state) => state.nets.currNetNum);
  const roundList = useAppSelector((state) => state.rounds.roundList);
  const teamA = useAppSelector((state) => state.teams.teamA);
  const teamB = useAppSelector((state) => state.teams.teamB);

  const dialogSettingEl = useRef<HTMLDialogElement | null>(null);

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

  useEffect(() => {
    if(allNets && allNets.length > 0){
      dispatch(setNetsByRoundId(currRoundId));
    }
  }, [allNets]);

  useEffect(() => {
    if (currRoundNets && currRoundNets.length > 0) {
      dispatch(setCurrNetNum(currRoundNets[0].num));
    }
  }, [currRoundNets]);

  return (
    <div className="net-score container px-4 mx-auto flex justify-between gap-1 text relative">
      {/* Left side round detail start  */}
      <div className="round-detail w-3/6" style={{ height: '30rem' }}>
        <div className="round-top h-3/6 w-full bg-gray-900 text-gray-100 px-2 flex flex-col items-center justify-around">
          <LogoMatchScore dark team={teamA} />

          <div className="round-nums mt-4 flex w-full justify-between items-center">
            {roundList.map((round) => (
              <p className="single-r bg-gray-100 text-gray-900 p-1 text-center" key={round._id}>
                RD{round.num}
              </p>
            ))}
          </div>
          <PointsByRound roundList={roundList} dark />
        </div>
        <div className="round-bottom h-3/6 w-full border border-gray-900 px-2 flex flex-col items-center justify-around">
          <PointsByRound roundList={roundList} dark={false} />
          <LogoMatchScore dark={false} team={teamB} />
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
      <div className="img-holder p-2 w-8 absolute left-1 border-3 bg-gray-100 rounded-full cursor-pointer" style={{ top: '47%' }} role="presentation" onClick={handleSettingOpen} onKeyDown={(e) => {}}>
        <img src="/icons/setting.svg" alt="setting" className="w-full" />
      </div>
      {/* Setting end  */}
      
      {/* Right side net detail start */}
      {screenWidth > screen.xs ? currRoundNets.map((net) => <NetCard key={net._id} net={net} />) : <NetCard net={currRoundNets.find((n) => n.num === currNetNum)} />}
      {/* Right side net detail end */}
    </div>
  );
}

export default NetScoreOfRound;