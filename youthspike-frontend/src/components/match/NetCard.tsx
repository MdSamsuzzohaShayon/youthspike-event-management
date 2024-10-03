/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';

// Redux
import { setCurrNetNum } from '@/redux/slices/netSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';


// Types
import { INetRelatives } from '@/types';
import { EXTRA_HEIGHT } from '@/utils/constant';

import NetPointCard from './NetPointCard';
import NetTeamSelect from '../net/NetTeamSelect';

interface INetCardProps {
  screenWidth: number;
  boardHeight: number;
  net: INetRelatives | null;
}

// Constant
const touchThreshold: number = 50;

function NetCard({ net, screenWidth, boardHeight }: INetCardProps) {
  // Hook
  const dispatch = useAppDispatch();

  // Redux State
  const { currNetNum, currentRoundNets: currRoundNets } = useAppSelector((state) => state.nets);
  const { roundList } = useAppSelector((state) => state.rounds);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { myTeamE, opTeamE } = useAppSelector((state) => state.matches);

  // Local State
  const [startPosX, setStartPosX] = useState<number>(0);

  /**
   * Handle events
   */
  const handleRightShift = () => {
    const netIndex = currRoundNets.findIndex((n) => n.num === currNetNum);
    if (netIndex === null || netIndex === 0) return;
    const prevNet = currRoundNets[netIndex - 1];
    if (!prevNet) return;
    dispatch(setCurrNetNum(prevNet.num));
  };

  const handleLeftShift = () => {
    const netIndex = currRoundNets.findIndex((n) => n.num === currNetNum);
    if (netIndex === null || netIndex + 1 >= currRoundNets.length) return;
    const nextNet = currRoundNets[netIndex + 1];
    if (!nextNet) return;
    dispatch(setCurrNetNum(nextNet.num));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartPosX(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const newEndPositionX = e.changedTouches[0].clientX;
    if (startPosX - newEndPositionX > touchThreshold) {
      handleLeftShift();
    } else if (newEndPositionX - startPosX > touchThreshold) {
      handleRightShift();
    }
  };

  return (
    <div
      className="net-detail w-full h-full relative flex justify-center items-center flex-col"
      style={{ minHeight: `${boardHeight + EXTRA_HEIGHT}px` }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Net top section start  */}
      <NetTeamSelect boardHeight={boardHeight} net={net} onTop teamE={opTeamE} />
      {/* Net top section end  */}

      {/* Vertically centered NetPointCard component */}
      <div className="flex-grow flex justify-center items-center cursor-pointer">
        <NetPointCard net={net} handleLeftShift={handleLeftShift} handleRightShift={handleRightShift} screenWidth={screenWidth} currRoom={currentRoom} roundList={roundList} />
      </div>

      {/* Net bottom section start  */}
      <NetTeamSelect boardHeight={boardHeight} net={net} onTop={false} teamE={myTeamE} />
      {/* Net bottom section end */}
    </div>
  );
}

export default NetCard;
