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
  const allNets = useAppSelector((state) => state.nets.nets);

  /**
   * Round score and point credentials
   */
  // score = round.teamBScore ?? 0;

  const calcScore = (round: IRoundRelatives): React.ReactNode => {
    let score = 0;
    let plusMinusScore = 0;
    const findNets = allNets.filter((n) => n.round === round._id);

    if (dark) {
      // Dark for oponent
      if (myTeamE === ETeam.teamA) {
        for (let i = 0; i < findNets.length; i++) {
          // @ts-ignore
          if (findNets[i].teamAScore && findNets[i].teamBScore && findNets[i].teamAScore > findNets[i].teamBScore) score += 1;
        }
        const fullPoints = round.teamAScore ? round.teamAScore : 0;
        plusMinusScore = fullPoints - (round.teamBScore ?? 0);
      } else {
        for (let i = 0; i < findNets.length; i++) {
          // @ts-ignore
          if (findNets[i].teamBScore  && findNets[i].teamAScore && findNets[i].teamBScore > findNets[i].teamAScore) score += 1;
        }
        const fullPoints = round.teamBScore ? round.teamBScore : 0;
        plusMinusScore = fullPoints - (round.teamAScore ?? 0);
      }
    } else {
      // Dark for oponent
      if (myTeamE === ETeam.teamA) {
        for (let i = 0; i < findNets.length; i++) {
          // @ts-ignore
          if (findNets[i].teamBScore && findNets[i].teamAScore && findNets[i].teamBScore > findNets[i].teamAScore) score += 1;
        }
        const fullPoints = round.teamBScore ? round.teamBScore : 0;
        plusMinusScore = fullPoints - (round.teamAScore ?? 0);
      } else {
        for (let i = 0; i < findNets.length; i++) {
          // @ts-ignore
          if (findNets[i].teamAScore  && findNets[i].teamBScore && findNets[i].teamAScore > findNets[i].teamBScore) score += 1;
        }
        const fullPoints = round.teamAScore ? round.teamAScore : 0;
        plusMinusScore = fullPoints - (round.teamBScore ?? 0);
      }
    }
    return <React.Fragment><p className={`plus-minus ${plusMinusScore >= 0 ? "text-green-600" : "text-red-600"} w-full text-center h-6`}>{plusMinusScore > 0 ? "+" + plusMinusScore : plusMinusScore}</p>
      <p className={`base-point w-full border ${dark ? 'border-gray-100' : 'border-gray-900'} p-1 text-center`}>{score}</p>
    </React.Fragment>;
  }


  return (
    <div className={`points-by-round flex justify-start items-center w-full ${dark ? "text-gray-100" : "text-gray-900"} gap-1`}>
      {roundList.map((round, i) => (<div className="r-box w-8" key={i} >

        {calcScore(round)}
      </div>))}
    </div>
  );
}

export default PointsByRound;