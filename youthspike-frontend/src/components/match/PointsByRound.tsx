import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { IRoundRelatives } from '@/types';
import { screen } from '@/utils/constant';
import { border } from '@/utils/styles';
import { calcRoundScore } from '@/utils/scoreCalc';

interface IPointsByRoundProps {
  dark: boolean;
  roundList: IRoundRelatives[];
  screenWidth: number;
}

function PointsByRound({ dark, roundList, screenWidth }: IPointsByRoundProps) {
  const { myTeamE, opTeamE } = useAppSelector((state) => state.matches);
  const allNets = useAppSelector((state) => state.nets.nets);

  const renderScore = (round: IRoundRelatives) => {
    const teamE = dark ? opTeamE : myTeamE;
    const { score, plusMinusScore } = calcRoundScore(
      allNets.filter((n) => n.round === round._id),
      round,
      teamE,
    );

    const basePointBorderColor = (() => {
      
      if (plusMinusScore === 0) {
        return dark ? border.dark : border.light;
      }
      if (plusMinusScore > 0) {
        return border.green;
      }
      return border.red;
    })();

    const plusMinusColorClass = plusMinusScore >= 0 ? 'text-green-600' : 'text-red-600';

    return (
      <>
        <p className={`plus-minus w-full text-center h-6 ${plusMinusColorClass}`}>{plusMinusScore > 0 ? `+${plusMinusScore}` : plusMinusScore}</p>
        <p className={`base-point h-10 w-full border ${basePointBorderColor} ${dark ? 'rounded-t-lg' : 'rounded-b-lg'} text-center flex justify-center items-center`}>{score}</p>
      </>
    );
  };

  const renderRoundBox = (round: IRoundRelatives) => {
    const roundBoxClass = screenWidth > screen.xs ? 'text-xs w-6' : 'text-sm w-8';
    const flexDirectionClass = dark ? 'flex-col' : 'flex-col-reverse';

    return (
      <div className={`r-box ${roundBoxClass} flex flex-wrap ${flexDirectionClass} justify-center items-center`} key={round._id}>
        {renderScore(round)}
      </div>
    );
  };

  return (
    <div className={`points-by-round flex flex-wrap justify-start items-center w-full ${dark ? 'text-white' : 'text-gray-900'} gap-1`}>
      {roundList.map((round) => (
        <React.Fragment key={round._id}>{renderRoundBox(round)}</React.Fragment>
      ))}
    </div>
  );
}

export default PointsByRound;
