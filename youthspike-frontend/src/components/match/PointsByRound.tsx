import { IRoundRelatives } from '@/types';
import React from 'react';

interface IPointsByRoundProps{
  dark: boolean;
  roundList: IRoundRelatives[];
}

function PointsByRound({ dark, roundList }: IPointsByRoundProps) {
  /**
   * Round score and point credentials
   */
  return (
    <div className={`points-by-round flex justify-between items-center w-full ${dark ? "text-gray-100" : "text-gray-900"}`}>
      {roundList.map((round, i) => (<div className="r-box " key={i} >
        <p className="plus text-green-600 w-full text-center h-6">5+</p>
        <p className={`base-point w-full border ${dark ? 'border-gray-100' : 'border-gray-900'} p-1 text-center`}>12</p>
      </div>))}
    </div>
  );
}

export default PointsByRound;