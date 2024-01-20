import { useAppSelector } from '@/redux/hooks';
import { IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import React from 'react';

interface IPointsByRoundProps {
  dark: boolean;
  roundList: IRoundRelatives[];
}

function PointsByRound({ dark, roundList }: IPointsByRoundProps) {
  const { myTeamE } = useAppSelector((state) => state.matches);

  /**
   * Round score and point credentials
   */

  const renderScore = (round: IRoundRelatives): React.ReactNode => {
    let score = 0;
    let plusMinusScore = 10;
    if (dark) {
      // Dark for oponent
      if (myTeamE === ETeam.teamA) {
        score = round.teamAScore ?? 0;
        plusMinusScore = score - (round.teamBScore ?? 0);
      } else {
        score = round.teamBScore ?? 0;
        plusMinusScore = score - (round.teamAScore ?? 0);
      }
    } else {
      // Dark for oponent
      if (myTeamE === ETeam.teamA) {
        score = round.teamBScore ?? 0;
        plusMinusScore = score - (round.teamAScore ?? 0);
      } else {
        score = round.teamAScore ?? 0;
        plusMinusScore = score - (round.teamBScore ?? 0);
      }
    }
    return <React.Fragment><p className={`plus-minus ${plusMinusScore >= 0 ? "text-green-600" : "text-red-600"} w-full text-center h-6`}>{plusMinusScore > 0 ? "+" + plusMinusScore : plusMinusScore}</p>
      <p className={`base-point w-full border ${dark ? 'border-gray-100' : 'border-gray-900'} p-1 text-center`}>{score}</p>
    </React.Fragment>;
  }
  return (
    <div className={`points-by-round flex justify-start items-center w-full ${dark ? "text-gray-100" : "text-gray-900"} gap-1`}>
      {roundList.map((round, i) => (<div className="r-box w-8" key={i} >

        {renderScore(round)}
      </div>))}
    </div>
  );
}

export default PointsByRound;