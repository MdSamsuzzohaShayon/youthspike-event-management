import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { screen } from '@/utils/constant';
import { border } from '@/utils/styles';

interface IPointsByRoundProps {
  dark: boolean;
  roundList: IRoundRelatives[];
  screenWidth: number;
}

function PointsByRound({ dark, roundList, screenWidth }: IPointsByRoundProps) {
  const { myTeamE } = useAppSelector((state) => state.matches);
  const allNets = useAppSelector((state) => state.nets.nets);

  const calculateScores = (findNets: any[], round: IRoundRelatives, dark: boolean) => {
    // Remove the myTeamE declaration here
    let score = 0;
    let plusMinusScore = 0;

    findNets.forEach((net) => {
      const teamAScore = net.teamAScore || 0;
      const teamBScore = net.teamBScore || 0;

      if (dark) {
        if (myTeamE === ETeam.teamA && teamAScore > teamBScore) {
          score += 1;
        } else if (myTeamE === ETeam.teamB && teamBScore > teamAScore) {
          score += 1;
        }
      } else {
        if (myTeamE === ETeam.teamA && teamBScore > teamAScore) {
          score += 1;
        } else if (myTeamE === ETeam.teamB && teamAScore > teamBScore) {
          score += 1;
        }
      }
    });

    const fullPoints = dark ? round.teamBScore || 0 : round.teamAScore || 0;
    plusMinusScore = fullPoints - (dark ? round.teamAScore || 0 : round.teamBScore || 0);

    return { score, plusMinusScore };
  }

  const calcScore = (round: IRoundRelatives): React.ReactNode => {
    const { score, plusMinusScore } = calculateScores(allNets.filter((n) => n.round === round._id), round, dark);

    return (
      <React.Fragment>
        <p className={`plus-minus ${plusMinusScore >= 0 ? 'text-green-600' : 'text-red-600'} w-full text-center h-6`}>
          {plusMinusScore > 0 ? `+${plusMinusScore}` : plusMinusScore}
        </p>
        <p className={`base-point w-full ${dark ? border.dark : border.light} text-center`}>{score}</p>
      </React.Fragment>
    );
  };

  return (
    <div className={`points-by-round flex justify-start items-center w-full ${dark ? 'text-gray-100' : 'text-gray-900'} gap-1`}>
      {roundList.map((round, i) => (
        <div className={`r-box ${screenWidth > screen.xs ? "text-xs w-6" : "text-sm w-8"}`} key={i}>
          {calcScore(round)}
        </div>
      ))}
    </div>
  );
}

export default PointsByRound;