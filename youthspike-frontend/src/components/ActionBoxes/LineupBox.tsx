import React from 'react';
import Image from 'next/image';
import { useAppSelector } from '@/redux/hooks';
import { EActionProcess } from '@/types/room';
import PointText from './PointText';

interface IBoxProps {
  otp: EActionProcess;
}

function LineupBox({ otp }: IBoxProps) {
  const { current: currentRound } = useAppSelector((state) => state.rounds);
  const roundNumber = currentRound?.num ?? '';

  const isLineup = otp === EActionProcess.LINEUP;

  const pointText = `Round ${roundNumber} - ${isLineup ? 'Game Play' : 'Player Assignments'}`;
  const boxClass = isLineup ? 'box-success' : 'box-danger';

  return (
    <div className={`w-full py-2 ${boxClass}`}>
      <div className="container px-4 mx-auto flex w-full justify-between items-center gap-1">
        {/* Left Column */}
        <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
          <PointText txt={pointText} />
          {isLineup ? (
            <>
              <h2 className="font-black text-start">Go Play. Placing team always picks serve or receive. Enter scores when done.</h2>
              {/* <button className="btn-light" type="button">
                Score keeper
              </button> */}
            </>
          ) : (
            <>
              <h2 className="font-black text-start">Waiting for the other squad to MATCH their lineup.</h2>
              <button className="btn-light-outline" type="button">
                YOU PLACED YOUR LINEUP
              </button>
            </>
          )}
        </div>

        {/* Right Column Image */}
        <div className="hidden md:block w-2/6">
          <Image width={300} height={300} src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
        </div>
      </div>
    </div>
  );
}

export default LineupBox;
