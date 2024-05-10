import React from 'react';
import { INetRelatives, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { calcRoundScore } from '@/utils/scoreCalc';

interface IPointsByRoundPublicProps {
  roundList: IRoundRelatives[];
  teamE: ETeam;
  allNets: INetRelatives[];
  // eslint-disable-next-line react/require-default-props
  dark?: boolean;
}

function PointsByRoundPublic({ roundList, dark, allNets, teamE }: IPointsByRoundPublicProps) {
  const calcScore = (round: IRoundRelatives): React.ReactNode => {
    const {score} = calcRoundScore(
      allNets.filter((n) => n.round === round._id),
      round,
      teamE,
    );

    return <p className={`base-point h-8 w-8 ${dark ? 'bg-gray-100 text-gray-900' : 'border'} rounded-full text-center flex justify-center items-center`}>{score}</p>;
  };

  return (
    <div className="points-by-round flex justify-center items-center w-full text-gray-100 gap-x-1">
      {roundList.map((round) => (
        <div className="r-box w-12 flex flex-col justify-center items-center" key={round._id}>
          {calcScore(round)}
        </div>
      ))}
    </div>
  );
}

export default PointsByRoundPublic;
