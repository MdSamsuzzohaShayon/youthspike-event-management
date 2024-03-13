import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { INetRelatives, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
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

  const calcScore = (round: IRoundRelatives): React.ReactNode => {
    const teamE = dark ? opTeamE : myTeamE;
    
    const { score, plusMinusScore } = calcRoundScore(allNets.filter((n) => n.round === round._id), round, teamE);

    return (
      <React.Fragment>
        <p className={`plus-minus ${plusMinusScore >= 0 ? 'text-green-600' : 'text-red-600'} w-full text-center h-6`}>
          {plusMinusScore > 0 ? `+${plusMinusScore}` : plusMinusScore}
        </p>
        <p className={`base-point h-10 w-full border ${dark ? border.dark + " rounded-t-lg" : border.light + " rounded-b-lg"} text-center flex justify-center items-center`}>{score}</p>
      </React.Fragment>
    );
  };

  return (
    <div className={`points-by-round flex justify-start items-center w-full ${dark ? 'text-gray-100' : 'text-gray-900'} gap-1`}>
      {roundList.map((round, i) => (
        <div className={`r-box ${screenWidth > screen.xs ? "text-xs w-6" : "text-sm w-8"} flex ${dark ? "flex-col" : "flex-col-reverse"} justify-center items-center`} key={i}>
          {calcScore(round)}
        </div>
      ))}
    </div>
  );
}

export default PointsByRound;