import Image from 'next/image';
import { useAppSelector } from '@/redux/hooks';
import { EActionProcess } from '@/types/room';
import React, { useEffect, useState } from 'react';
import PointText from './PointText';

interface IBoxProps {
  otp: EActionProcess;
}

function LineupBox({ otp }: IBoxProps) {
  // ===== Hooks =====

  // ===== Local State =====
  const [pTxt, setPTxt] = useState<string>('');
  const [bgBox, setBgBox] = useState<string>('box-danger');

  const { current: currentRound } = useAppSelector((state) => state.rounds);

  useEffect(() => {
    let pt = '';
    let bb = 'box-danger';
    if (otp === EActionProcess.LINEUP) {
      pt = `Round ${currentRound?.num} - Game Play`;
      bb = 'box-success';
    } else {
      pt = `Round ${currentRound?.num} - Player Assignments`;
      bb = 'box-danger';
    }
    setPTxt(pt);
    setBgBox(bb);
  }, [otp, currentRound]);

  return (
    <div className={`flex py-2 w-full justify-between items-center gap-1 ${bgBox}`}>
      <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
        <PointText txt={pTxt} />
        {otp === EActionProcess.LINEUP ? (
          <h2 className="font-black text-start">Time to go PLAY. Once the games are finished, input the scores to complete round.</h2>
        ) : (
          <>
            <h2 className="font-black text-start">Waiting for the other squad to MATCH their lineup.</h2>
            <button className="btn-light-outline" type="button">
              YOU PLACED YOUR LINEUP
            </button>
          </>
        )}
      </div>
      <div className="hidden md:block w-2/6">
        <Image width={300} height={300} src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  );
}

export default LineupBox;
